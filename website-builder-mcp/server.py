"""
Website Builder MCP
===================

A standalone MCP server that lets an AI (Claude / ChatGPT) build a full business
website by talking to the GenieBuild / SmartlyBuild backend.

The AI just describes a business in plain words; this server turns that into a
call to the backend's `/admin/v1/createBusinessWebsite` endpoint, which runs the
existing AI section-generation + deploy pipeline and returns the new site.

Nothing is stored here — this server is only a connector. All data lives in the
builder's own database.

Config (env vars):
  BUILDER_API_BASE   e.g. http://localhost:1111   (the backend base URL)
  BUILDER_API_TOKEN  a JWT for the account that owns the sites (Bearer token)
  BUILDER_USER_ID    (optional) userId to attach sites to, if not in the token
"""

import os
import re
import httpx
from mcp.server.fastmcp import FastMCP

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
API_BASE = os.environ.get("BUILDER_API_BASE", "http://localhost:1111").rstrip("/")
API_TOKEN = os.environ.get("BUILDER_API_TOKEN", "")
USER_ID = os.environ.get("BUILDER_USER_ID", "")

# --- endpoints (all under /admin/v1) ---
# NOTE: this MCP deliberately does NOT trigger the backend's OpenAI section
# generation. The AI (Claude / ChatGPT) writes the content itself and we just
# SAVE it — so there is no OpenAI cost. The backend's own OpenAI pipeline is
# left completely untouched (the admin panel still uses it).
EP_BUSINESS = f"{API_BASE}/admin/v1/createBusinessWebsite"   # create project (business mode)
EP_BULK = f"{API_BASE}/admin/v1/createProject"               # create project (bulk mode)
EP_PAGES = f"{API_BASE}/admin/v1/bulkUpsertWebsitePages"     # create the pages
EP_SAVE_CONTENT = f"{API_BASE}/admin/v1/upsertSectionContentFromBuilder"  # SAVE AI-written content (no OpenAI)
EP_SAVE_DESIGN = f"{API_BASE}/admin/v1/saveWebsiteDesignData"  # SAVE the page/section design structure (render-ready)
EP_THEME = f"{API_BASE}/admin/v1/updateProjectTheme"          # SAVE the colour theme (this is what the site actually renders)
EP_LIST = f"{API_BASE}/admin/v1/getUserProjects"             # list my sites
EP_PROGRESS = f"{API_BASE}/admin/v1/getProjectsSectionGenerationProgress"  # build status
EP_IMAGES = f"{API_BASE}/admin/v1/generateUnsplashImages"   # real per-niche stock images (Unsplash)

# --- hosting + domain endpoints (all under /admin/v1) ---
# These wrap the SAME flow the admin panel uses to host a finished site and
# connect a custom domain. No backend code is changed — the MCP only calls them.
EP_ADD_HOSTING = f"{API_BASE}/admin/v1/addHosting"                 # add an FTP/cPanel/SSH/VPS connection
EP_VERIFY_HOSTING = f"{API_BASE}/admin/v1/verifyHosting"          # test a saved hosting connection works
EP_MY_HOSTINGS = f"{API_BASE}/admin/v1/getMyHostings"             # list my hosting connections
EP_DEL_HOSTING = f"{API_BASE}/admin/v1/deleteHosting"            # delete one (/:id)
EP_BROWSE_DIRS = f"{API_BASE}/admin/v1/browseHostingDirectories"  # list folders on the host
EP_LINK_HOSTING = f"{API_BASE}/admin/v1/linkProjectToHosting"    # link project+domain+rootPath to a host
EP_LINKED_HOSTINGS = f"{API_BASE}/admin/v1/getLinkedHostings"    # linked hostings for a project (/:projectId)
EP_BUILD_STATIC = f"{API_BASE}/admin/v1/buildStaticSite"          # build the static site for a project
EP_BUILD_STATUS = f"{API_BASE}/admin/v1/getStaticBuildStatus"    # poll the static build status
EP_UPLOAD_BUILD = f"{API_BASE}/admin/v1/uploadToHostingFromBuild"  # push the built site to the host
EP_DEPLOY_INFO = f"{API_BASE}/admin/v1/getDeployInfo"            # deployment info for a project
EP_CONNECT_DOMAIN = f"{API_BASE}/admin/v1/connectDomain"        # connect a custom domain (VPS/our hosting)
EP_UNLINK_DOMAIN = f"{API_BASE}/admin/v1/unlinkDomain"          # disconnect a domain
EP_CHECK_DOMAIN = f"{API_BASE}/admin/v1/checkDomain"            # check a domain's status
EP_UPDATE_DOMAIN = f"{API_BASE}/admin/v1/updateProjectDomain"    # set/update the project's domain
EP_DOMAINS_ADD = f"{API_BASE}/admin/v1/domains"                  # add a domain record
EP_DOMAINS_LIST = f"{API_BASE}/admin/v1/domains/list"           # list domain records
EP_DOMAIN_VERIFY = f"{API_BASE}/admin/v1/domains/verify"        # verify a domain (dns/file/meta)

# --- sub-admin (team) endpoints ---
# Same flow the admin panel's "Sub Admin" page uses to add team members.
EP_CREATE_USER = f"{API_BASE}/admin/v1/create_user"             # create a sub-admin / user
EP_FETCH_USERS = f"{API_BASE}/admin/v1/fetch_users"            # list sub-admins / users (paged)

CREATE_ENDPOINT = EP_BUSINESS  # kept for backwards-compat

# Unique server name so it can never be confused with the wptaskify MCP server
# (or any other) when several are connected to the same AI client at once.
mcp = FastMCP("smartlybuild-builder")


def _auth_headers() -> dict:
    h = {"Content-Type": "application/json"}
    if API_TOKEN:
        token = API_TOKEN if API_TOKEN.lower().startswith("bearer ") else f"Bearer {API_TOKEN}"
        h["Authorization"] = token
    return h


async def _post(url: str, payload: dict) -> tuple[int, dict | str]:
    """POST helper → (status_code, parsed_json_or_text)."""
    async with httpx.AsyncClient(timeout=150) as client:
        resp = await client.post(url, json=payload, headers=_auth_headers())
    try:
        return resp.status_code, resp.json()
    except Exception:
        return resp.status_code, resp.text


def _auth_headers_noct() -> dict:
    """Auth headers WITHOUT a forced Content-Type — for multipart/form posts
    (httpx sets the multipart boundary itself)."""
    h = {}
    if API_TOKEN:
        token = API_TOKEN if API_TOKEN.lower().startswith("bearer ") else f"Bearer {API_TOKEN}"
        h["Authorization"] = token
    return h


async def _post_form(url: str, fields: dict) -> tuple[int, dict | str]:
    """POST as multipart/form-data → (status, json_or_text). The hosting/domain
    endpoints use FormData (like the admin panel), not JSON."""
    data = {k: ("" if v is None else str(v)) for k, v in fields.items()}
    async with httpx.AsyncClient(timeout=150) as client:
        # httpx `data=` with `files={}` forces multipart encoding + boundary.
        resp = await client.post(url, data=data, files={"_": ("", "")}, headers=_auth_headers_noct())
    try:
        return resp.status_code, resp.json()
    except Exception:
        return resp.status_code, resp.text


async def _get(url: str) -> tuple[int, dict | str]:
    """GET helper → (status_code, parsed_json_or_text)."""
    async with httpx.AsyncClient(timeout=150) as client:
        resp = await client.get(url, headers=_auth_headers())
    try:
        return resp.status_code, resp.json()
    except Exception:
        return resp.status_code, resp.text


async def _fetch_images(query: str, n: int = 6) -> list[str]:
    """Fetch real Unsplash image URLs for a niche/query via the backend. Returns
    up to `n` urls; empty list on any failure (caller falls back to placeholders).
    This is why MCP-built sites get varied, on-topic photos instead of one repeated
    stock image."""
    q = (query or "").strip()
    if not q:
        return []
    try:
        code, data = await _post(EP_IMAGES, {"query": q})
    except Exception:
        return []
    if code >= 400 or not isinstance(data, dict):
        return []
    imgs = data.get("images") or []
    urls: list[str] = []
    for it in imgs:
        u = (it.get("url") if isinstance(it, dict) else None) or (it if isinstance(it, str) else None)
        if isinstance(u, str) and u.strip():
            urls.append(u.strip())
        if len(urls) >= n:
            break
    return urls


def _build_create_payload(business_name, business_type, services, location, focus_keyword, keywords, with_images):
    """Shared payload builder for business + bulk create (same shape)."""
    fk = focus_keyword.strip() or (
        f"{business_type.strip().lower()} in {location.strip()}"
        if location.strip() else business_type.strip().lower()
    )
    kw = keywords.strip() or _slug_keywords(business_type, business_name, location)
    subs = [s.strip() for s in (services or []) if str(s).strip()]
    if not subs:
        bt = business_type.strip().lower()
        subs = [f"{bt} repair", f"{bt} installation", f"{bt} maintenance"]
    payload = {
        "projectName": business_name.strip(),
        "serviceType": business_type.strip(),
        "categories": [business_type.strip()],
        "subCategories": subs,
        "microCategories": [],
        "focusKeyword": fk,
        "projectKeywordsText": kw,
        "wantImages": 1 if with_images else 0,
    }
    if USER_ID:
        payload["userId"] = USER_ID
    return payload, fk


def _slug_keywords(business_type: str, business_name: str, location: str) -> str:
    """Build a simple comma-separated SEO keyword string from the inputs."""
    parts = []
    bt = (business_type or "").strip().lower()
    loc = (location or "").strip()
    if bt:
        parts.append(bt)
        if loc:
            parts.append(f"{bt} in {loc}")
            parts.append(f"local {bt}")
            parts.append(f"best {bt} {loc}")
        parts.append(f"{bt} services")
        parts.append(f"affordable {bt}")
    # de-dup, keep order
    seen, out = set(), []
    for p in parts:
        k = p.lower()
        if k and k not in seen:
            seen.add(k)
            out.append(p)
    return ", ".join(out) if out else (business_name or "business")


def _format_created(data, name: str, kind: str, fk: str) -> str:
    """Format a create response into a friendly summary."""
    if isinstance(data, str):
        return f"[OK] {kind} website request accepted for '{name}'. Response: {data[:400]}"
    project_id = (
        data.get("projectId")
        or (data.get("project") or {}).get("_id")
        or (data.get("data") or {}).get("_id")
        or data.get("_id") or ""
    )
    url = data.get("siteUrl") or data.get("url") or (data.get("project") or {}).get("siteUrl") or ""
    status = data.get("message") or data.get("status") or "created"
    lines = [f"[OK] {kind} website creation started for '{name}'."]
    if project_id:
        lines.append(f"  - Project ID: {project_id}")
    if fk:
        lines.append(f"  - Focus keyword: {fk}")
    if url:
        lines.append(f"  - URL: {url}")
    lines.append(f"  - Status: {status}")
    lines.append("  - AI is generating sections + content in the background; the site appears in the builder shortly.")
    return "\n".join(lines)


def _extract_project_id(data) -> str:
    if isinstance(data, str):
        return ""
    return (
        data.get("projectId")
        or (data.get("project") or {}).get("_id")
        or (data.get("data") or {}).get("_id")
        or data.get("_id") or ""
    )


# section_id -> { type, variant }. Prefers the newer "Dark & Bold" builder
# variants (fully editable in the builder) for the homepage sections; falls back
# to the default variants for the rest.
SECTION_MAP = {
    "hero": {"type": "hero", "variant": "HeroDarkBold"},
    "about": {"type": "about", "variant": "AboutDarkBold"},
    "features": {"type": "features", "variant": "FeaturesDarkBold"},
    "servicesgrid": {"type": "services", "variant": "ServicesDarkBold"},
    "services": {"type": "services", "variant": "ServicesDarkBold"},
    "process": {"type": "process", "variant": "ProcessDarkBold"},
    "whychoose": {"type": "why-choose-us", "variant": "WhyChooseDarkBold"},
    "guarantee": {"type": "guarantee", "variant": "GuaranteeDarkBold"},
    "testimonials": {"type": "testimonials", "variant": "TestimonialsDarkBold"},
    "stats": {"type": "stats", "variant": "StatsDarkBold"},
    "areas": {"type": "areas", "variant": "AreasDarkBold"},
    "faq": {"type": "faq", "variant": "FAQDarkBold"},
    "cta": {"type": "cta", "variant": "CTADarkBold"},
    # about page
    "abouthero": {"type": "abouthero", "variant": "AboutHeroDefault"},
    "aboutwhychoose": {"type": "aboutwhychoose", "variant": "AboutWhyChooseDefault"},
    "aboutcta": {"type": "aboutcta", "variant": "AboutCtaDefault"},
    "aboutfaq": {"type": "aboutfaq", "variant": "AboutFaqDefault"},
    # contact page
    "contacthero": {"type": "contacthero", "variant": "ContactHeroDefault"},
    "contactinfo": {"type": "contactinfo", "variant": "ContactInfoDefault"},
    "contactform": {"type": "contactform", "variant": "ContactFormDefault"},
    # services list page
    "serviceslisthero": {"type": "serviceslisthero", "variant": "ServicesListHeroDefault"},
    "serviceslistgrid": {"type": "serviceslistgrid", "variant": "ServicesListGridDefault"},
}


def _map_section(section_id: str, idx: int) -> dict | None:
    sid = str(section_id or "").strip().lower()
    m = SECTION_MAP.get(sid)
    if not m:
        # unknown section -> reasonable default so it still renders/editable
        m = {"type": sid, "variant": "Default"}
    return {
        "variant_uniqueId": m["variant"],
        "componentId": None,
        "sectionData": {
            "id": f"sec-{sid}-{idx}",
            "type": m["type"],
            "content": {},
            "styles": {"variant": m["variant"]},
        },
    }


def _is_dark(hex_color: str) -> bool:
    """Rough luminance check so we pick readable text on the chosen background."""
    h = str(hex_color or "").strip().lstrip("#")
    if len(h) == 3:
        h = "".join(c * 2 for c in h)
    if len(h) != 6:
        return True
    try:
        r, g, b = int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)
    except ValueError:
        return True
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) < 140


def _build_custom_colors(background: str, accent: str, text: str = "") -> dict:
    """Turn the AI's simple palette (background + accent [+ text]) into the full
    customColors object the theme system / renderer expects."""
    bg = background or "#0A0E17"
    ac = accent or "#2563EB"
    dark = _is_dark(bg)
    heading = text or ("#F1F5F9" if dark else "#0F172A")
    desc = "#94A3B8" if dark else "#475569"
    on_accent = "#FFFFFF" if _is_dark(ac) else "#111111"
    return {
        "heading": heading,
        "description": desc,
        "surface": bg,
        "overlay": {"color": "rgba(0,0,0,0)", "blend": "multiply"},
        "primaryButton": {"bg": ac, "text": on_accent, "hover": ac},
        "secondaryButton": {
            "bg": "transparent", "text": heading,
            "border": ("rgba(255,255,255,0.16)" if dark else "rgba(15,23,42,0.12)"),
            "hover": ("rgba(255,255,255,0.08)" if dark else "rgba(15,23,42,0.05)"),
        },
        "accent": ac,
        "gradient": {"from": bg, "to": bg},
        "ring": ac,
        "shadow": "rgba(0,0,0,0.25)" if dark else "rgba(0,0,0,0.1)",
        "badge": {"text": ac, "background": f"{ac}22"},
        "trust": {"text": desc, "dot1": "#22C55E", "dot2": "#3B82F6", "dot3": "#F59E0B"},
    }


async def _apply_theme(project_id: str, name: str, background: str, accent: str, text: str = "") -> tuple[bool, str]:
    """Save a custom colour theme for the project (this is what the site renders)."""
    custom = _build_custom_colors(background, accent, text)
    payload = {
        "projectId": project_id,
        "theme": "custom",
        "presetId": -1,
        "customColors": custom,
    }
    if USER_ID:
        payload["userId"] = USER_ID
    try:
        code, data = await _post(EP_THEME, payload)
    except httpx.RequestError as e:
        return False, str(e)
    return (code < 400), (str(data)[:200])


# ---------------------------------------------------------------------------
# Tools  (all prefixed `builder_` to avoid clashing with the wptaskify MCP)
# ---------------------------------------------------------------------------
@mcp.tool()
async def builder_create_website(
    business_name: str,
    business_type: str,
    pages: list[dict],
    colors: dict | None = None,
    services: list[str] | None = None,
    location: str = "",
    focus_keyword: str = "",
    keywords: str = "",
) -> str:
    """Create a full business website — YOU (the AI) design it. You write the
    copy AND you choose the colour palette, so the builder's own OpenAI is NOT
    used (zero AI cost). This tool then creates the project, its pages, saves
    your content, applies your colours, and saves the render-ready design so it
    opens fully editable in the builder (all sections show in the sidebar).

    DESIGN RULES (important — make each site feel unique):
      • Choose colours that FIT THIS business. Do not reuse the same palette for
        every site. Examples of a good instinct:
           plumber/HVAC  -> trustworthy blues / navy
           salon/beauty  -> warm pinks / rose / gold
           restaurant    -> appetising reds / warm earth tones
           law/finance   -> deep navy / charcoal / gold accent
           landscaping   -> greens / earthy
        Keep it to a clean palette (a background, one accent, readable text) —
        NOT a different colour on every element.
      • Vary the page/section arrangement per business — don't output an
        identical section list every time.
      • Write real, on-brand copy for every section. Never leave it generic.

    Args:
        business_name: Brand shown on the site, e.g. "FlowPro Plumbing".
        business_type: Main trade/category, e.g. "plumbing", "dentist".
        pages: The pages to build, each with its sections and the CONTENT YOU
            WROTE. Shape:
              [
                {
                  "name": "home",              # page id: home | about | services | contact
                  "display_name": "Home",
                  "sections": [
                    {"section_id": "hero", "content": {"title": "...", "subtitle": "...", "ctaText": "..."}}
                  ]
                }
              ]
            Suggested sections: home -> hero, services, about, testimonials, faq, cta;
            about -> abouthero, aboutwhychoose, aboutcta, aboutfaq;
            contact -> contacthero, contactform, contactinfo.
        colors: The palette YOU pick for this business. Shape:
              {
                "name": "Coastal Blue",        # a short label
                "background": "#0A0E17",        # page background (dark or light)
                "accent": "#2563EB",            # buttons / highlights (the brand colour)
                "text": "#F1F5F9"               # main readable text (optional)
              }
            If omitted, a neutral default is used — but you SHOULD choose colours.
        services: A few sub-services (>=1). Auto-derived if omitted.
        location / focus_keyword / keywords: Optional SEO; auto-derived if empty.
    """
    if not API_TOKEN:
        return "[ERROR] Not configured: set BUILDER_API_TOKEN (Bearer JWT)."
    if not business_name.strip():
        return "[ERROR] business_name is required."
    if not business_type.strip():
        return "[ERROR] business_type is required (e.g. 'plumbing')."
    if not pages or not isinstance(pages, list):
        return "[ERROR] pages is required — write at least one page with its sections + content."

    # 1) Create the project (no OpenAI is triggered by this call).
    payload, fk = _build_create_payload(business_name, business_type, services, location, focus_keyword, keywords, with_images=True)
    try:
        code, data = await _post(EP_BUSINESS, payload)
    except httpx.RequestError as e:
        return f"[ERROR] Could not reach the builder API at {EP_BUSINESS}: {e}"
    if code == 401:
        return "[ERROR] Auth failed (401). BUILDER_API_TOKEN missing/expired — refresh it."
    if code >= 400:
        return f"[ERROR] Create project failed ({code}): {str(data)[:400]}"

    project_id = _extract_project_id(data)
    if not project_id:
        return f"[WARN] Project created but no id returned: {str(data)[:300]}"

    # 2) Create the pages.
    pages_payload = []
    for pg in pages:
        pid = str(pg.get("name") or pg.get("id") or "").strip().lower()
        if not pid:
            continue
        pages_payload.append({
            "name": pid,
            "displayName": pg.get("display_name") or pg.get("displayName") or pid.title(),
            "description": pg.get("description") or "",
            "perLocationContent": False,
            "componentIds": [],
        })
    if not pages_payload:
        return f"[WARN] Project {project_id} created, but no valid pages were provided."

    code2, data2 = await _post(EP_PAGES, {"projectId": project_id, "pages": pages_payload, "deleteMissing": True})
    if code2 >= 400:
        return f"[WARN] Project {project_id} created but pages failed ({code2}): {str(data2)[:300]}"

    # Map page name -> created pageId.
    page_id_by_name = {}
    created = (data2 or {}).get("results", {}).get("created", []) if isinstance(data2, dict) else []
    for c in created:
        if isinstance(c, dict) and c.get("name"):
            page_id_by_name[str(c["name"]).lower()] = c.get("pageId")

    # 2.5) Fetch REAL, on-topic images for this business so the site doesn't fall
    #      back to the one repeated placeholder photo. We pull a small pool from the
    #      niche and drop them into image-bearing sections' content.images[].
    img_query = " ".join(x for x in [business_name.strip(), business_type.strip()] if x) or business_type.strip()
    niche_images = await _fetch_images(img_query or "business service", 8)
    # sections that visually want a photo
    IMG_SECTIONS = {"hero", "about", "abouthero", "services", "servicedetailhero",
                    "serviceslisthero", "whychooseus", "cta", "features", "gallery"}

    # 3) Save the AI-written content per page (this is what skips OpenAI).
    saved_sections = 0
    save_errors = []
    img_i = 0
    for pg in pages:
        pname = str(pg.get("name") or pg.get("id") or "").strip().lower()
        page_id = page_id_by_name.get(pname)
        if not page_id:
            continue
        sections = []
        for sec in (pg.get("sections") or []):
            sid = str(sec.get("section_id") or sec.get("sectionId") or "").strip().lower()
            if not sid:
                continue
            content = dict(sec.get("content") or {})
            # Inject a real image if this section wants one and the author didn't
            # already provide images / imageUrl.
            if (niche_images and sid in IMG_SECTIONS
                    and not content.get("images") and not content.get("imageUrl")):
                url = niche_images[img_i % len(niche_images)]
                img_i += 1
                content["images"] = [{"url": url}]
                content["imageUrl"] = url
            sections.append({"sectionId": sid, "content": content})
        if not sections:
            continue
        codeS, dataS = await _post(EP_SAVE_CONTENT, {"projectId": project_id, "pageId": page_id, "sections": sections})
        if codeS >= 400:
            save_errors.append(f"{pname}: {str(dataS)[:120]}")
        else:
            saved_sections += len(sections)

    # 4) Save the DESIGN STRUCTURE (which section variants each page uses) — this
    #    is what makes the site render + stay editable in the builder. Without it
    #    the preview shows "design data not found".
    design_pages = []
    for pg in pages:
        pname = str(pg.get("name") or pg.get("id") or "").strip().lower()
        page_id = page_id_by_name.get(pname)
        if not page_id:
            continue
        comp_ids = []
        for i, sec in enumerate(pg.get("sections") or []):
            sid = str(sec.get("section_id") or sec.get("sectionId") or "").strip().lower()
            if not sid:
                continue
            comp_ids.append(_map_section(sid, i))
        if comp_ids:
            design_pages.append({
                "pageId": page_id,
                "style": {"renderer": "geniebuild"},
                "componentIds": comp_ids,
            })

    # Colours: use the palette the AI chose for THIS business (falls back to a
    # neutral default). Saved into the theme, so the user can later say "change
    # the colour" (AI updates it) OR change it by hand in the builder.
    c = colors or {}
    color_name = str(c.get("name") or "Custom").strip() or "Custom"
    accent = str(c.get("accent") or c.get("primary") or "#2563EB").strip()
    background = str(c.get("background") or c.get("secondary") or "#0A0E17").strip()

    design_ok = False
    if design_pages:
        codeD, dataD = await _post(EP_SAVE_DESIGN, {
            "projectId": project_id,
            "skipAutoEnqueue": True,
            "colorScheme": color_name,
            "colorPrimary": accent,
            "colorSecondary": background,
            "colorAccent": accent,
            "pageStyles": {"style": {}, "perLocationContentByPage": {}},
            "pages": design_pages,
        })
        design_ok = codeD < 400
        if not design_ok:
            save_errors.append(f"design-data: {str(dataD)[:120]}")

    # 5) Apply the AI-chosen COLOURS via the theme system (this is what the site
    #    actually renders from — design-data colours are ignored by the renderer).
    text_color = str(c.get("text") or "").strip()
    theme_ok, theme_msg = await _apply_theme(project_id, color_name, background, accent, text_color)
    if not theme_ok:
        save_errors.append(f"theme: {theme_msg}")

    lines = [f"[OK] Website '{business_name.strip()}' ({business_type.strip()}) built with YOUR content + colours (no OpenAI used)."]
    lines.append(f"  - Project ID: {project_id}")
    lines.append(f"  - Design saved (render-ready): {'yes' if design_ok else 'no'}")
    lines.append(f"  - Colours applied: {'yes' if theme_ok else 'no'}  ({color_name}: accent {accent}, bg {background})")
    lines.append(f"  - Pages created: {len(pages_payload)}")
    lines.append(f"  - Sections saved: {saved_sections}")
    if save_errors:
        lines.append(f"  - Some saves failed: {'; '.join(save_errors[:4])}")
    lines.append("  - Opens fully editable in the builder — all sections show in the sidebar.")
    lines.append("  - To recolour later: call builder_update_colors, or edit by hand in the builder.")
    return "\n".join(lines)


@mcp.tool()
async def builder_update_colors(
    project_id: str,
    accent: str,
    background: str = "",
    name: str = "Custom",
) -> str:
    """Change an existing website's colour palette. Use this when the user says
    something like "make it blue" / "change the colours" — pick fitting colours
    and apply them. The site stays editable in the builder.

    Args:
        project_id: The site to recolour (from create response / builder_list_websites).
        accent: The brand colour (buttons / highlights), e.g. "#2563EB".
        background: Optional page background, e.g. "#0A0E17" (dark) or "#FFFFFF".
        name: Optional short label for the palette.
    """
    if not project_id.strip():
        return "[ERROR] project_id is required."
    if not accent.strip():
        return "[ERROR] accent colour is required (e.g. '#2563EB')."
    bg = background.strip() or "#0A0E17"
    ok, msg = await _apply_theme(project_id.strip(), name.strip() or "Custom", bg, accent.strip())
    if not ok:
        return f"[ERROR] Recolour failed: {msg}"
    return f"[OK] Colours updated for {project_id}: accent {accent}" + (f", background {background}" if background.strip() else "")


@mcp.tool()
async def builder_list_websites() -> str:
    """List the websites (projects) that belong to the connected account —
    name, id, type and status. Use this to see what has been created."""
    if not API_TOKEN:
        return "[ERROR] Not configured: set BUILDER_API_TOKEN (Bearer JWT)."
    try:
        code, data = await _post(EP_LIST, {})
    except httpx.RequestError as e:
        return f"[ERROR] Could not reach the builder API at {EP_LIST}: {e}"
    if code == 401:
        return "[ERROR] Auth failed (401). Refresh BUILDER_API_TOKEN."
    if code >= 400:
        return f"[ERROR] Builder API {code}: {str(data)[:400]}"

    # Response shape can vary; find a list of projects defensively.
    items = []
    if isinstance(data, dict):
        for key in ("data", "projects", "result", "items"):
            v = data.get(key)
            if isinstance(v, list):
                items = v
                break
        if not items and isinstance(data.get("data"), dict):
            for key in ("projects", "list", "items"):
                v = data["data"].get(key)
                if isinstance(v, list):
                    items = v
                    break
    elif isinstance(data, list):
        items = data

    if not items:
        return "No websites found for this account yet. Create one with builder_create_business_website."

    lines = [f"Your websites ({len(items)}):"]
    for p in items[:50]:
        if not isinstance(p, dict):
            continue
        pid = p.get("_id") or p.get("projectId") or ""
        name = p.get("projectName") or p.get("name") or "(unnamed)"
        ptype = p.get("projectType")
        kind = {0: "business", 1: "bulk", 2: "content"}.get(ptype, "site")
        lines.append(f"  - {name}  [{kind}]  id={pid}")
    return "\n".join(lines)


@mcp.tool()
async def builder_get_website_status(project_id: str) -> str:
    """Check how far along a website's AI section/content generation is. Pass the
    project_id returned when the site was created."""
    if not project_id.strip():
        return "[ERROR] project_id is required (from the create response or builder_list_websites)."
    try:
        code, data = await _post(EP_PROGRESS, {"projectId": project_id.strip()})
    except httpx.RequestError as e:
        return f"[ERROR] Could not reach the builder API at {EP_PROGRESS}: {e}"
    if code >= 400:
        return f"[ERROR] Builder API {code}: {str(data)[:400]}"
    # Return a compact summary; shape varies, so show key fields if present.
    if isinstance(data, dict):
        payload = data.get("data") or data
        return f"Status for {project_id}: {str(payload)[:600]}"
    return f"Status for {project_id}: {str(data)[:600]}"


def _elem(spec: dict, idx: int) -> dict:
    """Turn a simple element spec from the AI into a builder WebsiteElement.
    Supports the common Canvas element types so the AI can arrange a section
    freely (Elementor-style) rather than picking a fixed template."""
    import time as _t
    et = str(spec.get("type") or "text").strip().lower()
    content = spec.get("content") or {}
    style = spec.get("style") or {}
    eid = spec.get("id") or f"el-{et}-{idx}"

    # Sensible per-type content mapping so short specs still render well.
    if et in ("heading", "title"):
        et = "heading"
        content = {"text": content.get("text") or spec.get("text") or "Heading",
                   "htmlTag": content.get("htmlTag") or spec.get("tag") or "h2"}
    elif et in ("text", "paragraph", "subtitle"):
        et = "text"
        content = {"text": content.get("text") or spec.get("text") or "", "textSize": content.get("textSize") or "large"}
    elif et in ("button", "cta", "cta-button"):
        et = "cta-button"
        content = {"text": content.get("text") or spec.get("text") or "Learn more",
                   "link": content.get("link") or spec.get("link") or "#",
                   "buttonVariant": content.get("buttonVariant") or "primary"}
    elif et == "badge":
        content = {"text": content.get("text") or spec.get("text") or "Badge"}
    elif et in ("image", "img"):
        et = "image"
        content = {"imageUrl": content.get("imageUrl") or spec.get("url") or spec.get("image") or "",
                   "imageAlt": content.get("imageAlt") or spec.get("alt") or ""}
    elif et in ("stat", "stat-card"):
        et = "stat-card"
        content = {"value": content.get("value") or spec.get("value") or "100+",
                   "text": content.get("text") or spec.get("label") or "Happy customers",
                   "icon": content.get("icon") or spec.get("icon") or "fa-star"}
    elif et in ("feature", "feature-box", "icon-box", "card"):
        et = "feature-box"
        content = {"icon": content.get("icon") or spec.get("icon") or "fa-check",
                   "text": content.get("text") or spec.get("title") or "Feature",
                   "subText": content.get("subText") or spec.get("description") or "",
                   "iconPosition": content.get("iconPosition") or "top"}

    return {"id": eid, "type": et, "content": content, "style": style, "settings": {}}


@mcp.tool()
async def builder_arrange_section(
    project_id: str,
    page: str,
    elements: list[dict],
    section_style: dict | None = None,
) -> str:
    """Elementor-style: YOU (the AI) arrange a section FREELY from raw elements
    instead of picking a fixed template. Give the elements in the order/layout
    you want and this saves them as an editable freeform "Canvas" section on the
    given page. Every element stays fully editable in the builder.

    Use this to give each business a DISTINCTIVE, non-templated design.

    Args:
        project_id: The site to add the section to (from builder_create_website).
        page: The page name to attach it to, e.g. "home".
        elements: The elements YOU place, in order. Each:
              {"type": "...", "content": {...}, "style": {...}}
            Types you can use: heading, text, badge, button, image, stat-card,
            feature-box (card w/ icon), row (columns), column, divider, spacer,
            icon, star-rating, testimonial-card, trust-strip.
            For a 2-column layout use a "row":
              {"type":"row","content":{"columnCount":2,"gap":"3rem","children":[
                 {"type":"column","content":{"children":[ ...left elements... ]}},
                 {"type":"column","content":{"children":[ ...right elements... ]}}
              ]}}
            Put real content in every element. Style is theme-driven — you may
            add per-element style overrides (fontSize, padding, borderRadius…),
            but avoid hardcoding text colours (let the theme handle light/dark).
        section_style: Optional section wrapper style (e.g. {"minHeight":"620px",
            "bgPattern":"grid-glow"}).
    """
    if not project_id.strip():
        return "[ERROR] project_id is required."
    if not page.strip():
        return "[ERROR] page is required (e.g. 'home')."
    if not elements:
        return "[ERROR] elements is required — arrange at least one element."

    # Resolve the pageId for this page name.
    code, data = await _post(f"{API_BASE}/admin/v1/getWebsitePages/{project_id.strip()}", {})
    # getWebsitePages is a GET; fall back to bulk-upsert lookup if needed.
    page_id = ""
    try:
        async with httpx.AsyncClient(timeout=60) as client:
            r = await client.get(f"{API_BASE}/admin/v1/getWebsitePages/{project_id.strip()}", headers=_auth_headers())
        pdata = r.json()
        arr = pdata.get("data") or pdata.get("pages") or (pdata if isinstance(pdata, list) else [])
        for p in (arr or []):
            if isinstance(p, dict) and str(p.get("name") or "").lower() == page.strip().lower():
                page_id = p.get("_id") or p.get("pageId") or ""
                break
    except Exception:
        pass
    if not page_id:
        return f"[ERROR] Could not find page '{page}' on project {project_id}. Create it first via builder_create_website."

    # Build the Canvas elements (supports nested row/column).
    def build_list(specs, base):
        out = []
        for i, s in enumerate(specs or []):
            t = str(s.get("type") or "").lower()
            if t in ("row", "column"):
                kids = (s.get("content") or {}).get("children") or []
                el = {"id": s.get("id") or f"{base}-{t}-{i}", "type": t,
                      "content": {**(s.get("content") or {}), "children": build_list(kids, f"{base}-{t}{i}")},
                      "style": s.get("style") or {}, "settings": {}}
                out.append(el)
            else:
                out.append(_elem(s, i))
        return out

    canvas_elements = build_list(elements, "cv")

    # Save as a freeform Canvas section in the page's design data.
    section = {
        "pageId": page_id,
        "style": {"renderer": "geniebuild"},
        "componentIds": [{
            "variant_uniqueId": "CanvasFreeform",
            "componentId": None,
            "sectionData": {
                "id": f"canvas-{page.strip().lower()}",
                "type": "canvas",
                "content": {},
                "styles": {"variant": "CanvasFreeform", **(section_style or {})},
                "elements": canvas_elements,
            },
        }],
    }
    codeD, dataD = await _post(EP_SAVE_DESIGN, {
        "projectId": project_id.strip(),
        "skipAutoEnqueue": True,
        "pageStyles": {"style": {}, "perLocationContentByPage": {}},
        "pages": [section],
    })
    if codeD >= 400:
        return f"[ERROR] Save failed ({codeD}): {str(dataD)[:300]}"
    return (f"[OK] Arranged a freeform Canvas section on '{page}' with {len(canvas_elements)} top-level "
            f"elements. Fully editable in the builder.")


# ===========================================================================
# HOSTING + DOMAIN
# ---------------------------------------------------------------------------
# These tools take a site you built with builder_create_website and (1) connect
# a hosting account, (2) build + deploy the site to it, and (3) connect a custom
# domain. They call the exact endpoints the admin panel uses — nothing new on
# the backend. Typical order:
#   list_hostings → add_hosting (if none) → deploy_site → connect_domain
# ===========================================================================

@mcp.tool()
async def builder_list_hostings() -> str:
    """List the user's saved hosting connections (FTP / cPanel / SSH / VPS).
    Use this before deploying to see what hosts are available and their ids."""
    if not API_TOKEN:
        return "[ERROR] Not configured: set BUILDER_API_TOKEN."
    code, data = await _get(EP_MY_HOSTINGS)
    if code == 401:
        return "[ERROR] Auth failed (401). Refresh BUILDER_API_TOKEN."
    if code >= 400:
        return f"[ERROR] Could not list hostings ({code}): {str(data)[:300]}"
    rows = (data.get("data") if isinstance(data, dict) else data) or []
    if not rows:
        return "No hosting connections yet. Add one with builder_add_hosting."
    out = [f"{len(rows)} hosting connection(s):"]
    for h in rows:
        out.append(
            f"  • id={h.get('_id')} | type={h.get('connectionType')} | "
            f"status={h.get('status')} | ours={h.get('isOur')}"
        )
    return "\n".join(out)


@mcp.tool()
async def builder_add_hosting(connection_type: str, connection_config: str) -> str:
    """Add a hosting connection so a site can be deployed to it.

    Args:
        connection_type: one of 'ftp', 'cpanel', 'ssh', 'vps'.
        connection_config: the connection details as a JSON string. Shape depends
            on the type, e.g. FTP:
              '{"host":"ftp.example.com","port":21,"user":"u","password":"p"}'
            cPanel: '{"host":"...","username":"...","apiToken":"..."}'
            SSH/VPS: '{"host":"...","port":22,"user":"...","password":"..."}'
    """
    if not API_TOKEN:
        return "[ERROR] Not configured: set BUILDER_API_TOKEN."
    ct = (connection_type or "").strip().lower()
    if ct not in ("ftp", "cpanel", "ssh", "vps"):
        return "[ERROR] connection_type must be ftp | cpanel | ssh | vps."
    if not connection_config.strip():
        return "[ERROR] connection_config (JSON string) is required."
    code, data = await _post_form(EP_ADD_HOSTING, {
        "connectionType": ct,
        "connectionConfig": connection_config.strip(),
    })
    if code == 401:
        return "[ERROR] Auth failed (401). Refresh BUILDER_API_TOKEN."
    if code >= 400:
        return f"[ERROR] Add hosting failed ({code}): {str(data)[:300]}"
    return f"[OK] Hosting connection added ({ct}). Use builder_list_hostings to get its id."


@mcp.tool()
async def builder_verify_hosting(hosting_id: str) -> str:
    """Test that a saved hosting connection actually works (connects to the
    FTP/cPanel/SSH server). Run this after builder_add_hosting, before deploying.

    Args:
        hosting_id: the hosting connection id (from builder_list_hostings).
    """
    if not API_TOKEN:
        return "[ERROR] Not configured: set BUILDER_API_TOKEN."
    if not hosting_id.strip():
        return "[ERROR] hosting_id is required."
    code, data = await _post(EP_VERIFY_HOSTING, {"hostingId": hosting_id.strip()})
    if code == 401:
        return "[ERROR] Auth failed (401). Refresh BUILDER_API_TOKEN."
    if code == 404:
        return "[ERROR] Hosting not found. Check the id with builder_list_hostings."
    if code >= 400:
        msg = data.get("message") if isinstance(data, dict) else str(data)
        return f"[FAILED] Connection test failed: {str(msg)[:300]}"
    return "[OK] Hosting connection verified — it connects. Ready to deploy."


@mcp.tool()
async def builder_deploy_site(project_id: str, hosting_id: str = "", domain_name: str = "", root_path: str = "") -> str:
    """Build the site and deploy it to a hosting connection.

    Runs the same 3-step flow as the admin panel: build the static site, then
    push the build to the host. If hosting_id + root_path are given, the project
    is linked to that host first.

    Args:
        project_id: the site's projectId (from builder_create_website / builder_list_websites).
        hosting_id: the target hosting connection id (from builder_list_hostings). Optional
            if the project is already linked to a host.
        domain_name: the domain the site will serve on (e.g. "example.com"). Optional.
        root_path: the folder on the host to deploy into (e.g. "/public_html"). Optional.
    """
    if not API_TOKEN:
        return "[ERROR] Not configured: set BUILDER_API_TOKEN."
    if not project_id.strip():
        return "[ERROR] project_id is required."
    steps = []

    # 1) link project → hosting (only if a host + path were provided)
    if hosting_id.strip() and root_path.strip():
        codeL, dataL = await _post_form(EP_LINK_HOSTING, {
            "hostingId": hosting_id.strip(),
            "projectId": project_id.strip(),
            "domainName": domain_name.strip(),
            "rootPath": root_path.strip(),
        })
        if codeL >= 400:
            return f"[ERROR] Link project→hosting failed ({codeL}): {str(dataL)[:300]}"
        steps.append("linked project to hosting")

    # 2) build the static site
    codeB, dataB = await _post(EP_BUILD_STATIC, {"projectId": project_id.strip()})
    if codeB >= 400:
        return f"[ERROR] Build static site failed ({codeB}): {str(dataB)[:300]}"
    steps.append("build started")

    # 3) push the build to the host
    codeU, dataU = await _post(EP_UPLOAD_BUILD, {"projectId": project_id.strip()})
    if codeU >= 400:
        return (f"[PARTIAL] {', '.join(steps)}. Upload to host failed ({codeU}): "
                f"{str(dataU)[:250]}. Check build status with builder_deploy_status.")
    steps.append("uploaded to host")
    return f"[OK] Deploy flow: {', '.join(steps)}. Check builder_deploy_status('{project_id}')."


@mcp.tool()
async def builder_deploy_status(project_id: str) -> str:
    """Check the build / deployment status for a project after builder_deploy_site."""
    if not API_TOKEN:
        return "[ERROR] Not configured: set BUILDER_API_TOKEN."
    if not project_id.strip():
        return "[ERROR] project_id is required."
    code, data = await _post(EP_DEPLOY_INFO, {"projectId": project_id.strip()})
    if code >= 400:
        # fall back to the static build status endpoint
        code2, data2 = await _get(f"{EP_BUILD_STATUS}?projectId={project_id.strip()}")
        if code2 >= 400:
            return f"[ERROR] Could not read deploy status ({code}/{code2})."
        return f"Build status: {str(data2)[:400]}"
    return f"Deploy info: {str(data)[:500]}"


@mcp.tool()
async def builder_connect_domain(project_id: str, domain: str) -> str:
    """Connect a custom domain to a deployed site.

    Args:
        project_id: the site's projectId.
        domain: the domain to connect, e.g. "example.com".
    """
    if not API_TOKEN:
        return "[ERROR] Not configured: set BUILDER_API_TOKEN."
    if not project_id.strip() or not domain.strip():
        return "[ERROR] project_id and domain are required."
    dom = domain.strip().lower().replace("https://", "").replace("http://", "").strip("/")
    # record the domain on the project, then connect it
    await _post(EP_UPDATE_DOMAIN, {"projectId": project_id.strip(), "domain": dom})
    code, data = await _post(EP_CONNECT_DOMAIN, {"projectId": project_id.strip(), "domain": dom})
    if code == 401:
        return "[ERROR] Auth failed (401). Refresh BUILDER_API_TOKEN."
    if code >= 400:
        return f"[ERROR] Connect domain failed ({code}): {str(data)[:300]}"
    return (f"[OK] Domain '{dom}' connected to project {project_id}. "
            f"If DNS isn't pointed yet, verify with builder_verify_domain.")


@mcp.tool()
async def builder_verify_domain(domain: str, method: str = "dns") -> str:
    """Verify domain ownership / DNS pointing.

    Args:
        domain: the domain to verify, e.g. "example.com".
        method: 'dns' (default), 'file', or 'meta'.
    """
    if not API_TOKEN:
        return "[ERROR] Not configured: set BUILDER_API_TOKEN."
    if not domain.strip():
        return "[ERROR] domain is required."
    m = (method or "dns").strip().lower()
    if m not in ("dns", "file", "meta"):
        return "[ERROR] method must be dns | file | meta."
    code, data = await _post(EP_DOMAIN_VERIFY, {"domain": domain.strip().lower(), "method": m})
    if code >= 400:
        # fall back to checkDomain
        code2, data2 = await _post(EP_CHECK_DOMAIN, {"domain": domain.strip().lower()})
        return f"Domain check: {str(data2)[:400]}" if code2 < 400 else f"[ERROR] Verify failed ({code})."
    ok = isinstance(data, dict) and (data.get("success") or data.get("found"))
    return f"[{'OK' if ok else 'PENDING'}] {domain} ({m}): {str(data)[:300]}"


@mcp.tool()
async def builder_list_domains() -> str:
    """List the user's domain records."""
    if not API_TOKEN:
        return "[ERROR] Not configured: set BUILDER_API_TOKEN."
    code, data = await _get(EP_DOMAINS_LIST)
    if code >= 400:
        return f"[ERROR] Could not list domains ({code}): {str(data)[:300]}"
    rows = (data.get("data") if isinstance(data, dict) else data) or []
    if not rows:
        return "No domains yet."
    out = [f"{len(rows)} domain(s):"]
    for d in rows:
        out.append(f"  • {d.get('domain') or d.get('name')} | status={d.get('status')} | id={d.get('_id')}")
    return "\n".join(out)


# ===========================================================================
# SUB-ADMIN (team members)
# ---------------------------------------------------------------------------
# Wraps the admin panel's "Sub Admin" page: add team members and list them.
# ===========================================================================

@mcp.tool()
async def builder_list_subadmins(page: int = 1, limit: int = 20) -> str:
    """List sub-admins / team members (paged).

    Args:
        page: page number (1-based).
        limit: rows per page.
    """
    if not API_TOKEN:
        return "[ERROR] Not configured: set BUILDER_API_TOKEN."
    p = max(1, int(page or 1))
    lim = max(1, min(int(limit or 20), 100))
    code, data = await _get(f"{EP_FETCH_USERS}?page={p}&limit={lim}")
    if code == 401:
        return "[ERROR] Auth failed (401). Refresh BUILDER_API_TOKEN."
    if code >= 400:
        return f"[ERROR] Could not list sub-admins ({code}): {str(data)[:300]}"
    rows = (data.get("data") if isinstance(data, dict) else data) or []
    if isinstance(rows, dict):
        rows = rows.get("users") or rows.get("rows") or []
    if not rows:
        return "No sub-admins yet. Add one with builder_add_subadmin."
    out = [f"Sub-admins (page {p}):"]
    for u in rows:
        out.append(f"  • {u.get('fullName') or u.get('name')} | {u.get('email')} | "
                   f"{u.get('phone','')} | id={u.get('_id')}")
    return "\n".join(out)


@mcp.tool()
async def builder_add_subadmin(full_name: str, email: str, phone: str, password: str, address: str) -> str:
    """Add a sub-admin / team member.

    Args:
        full_name: the person's name.
        email: their login email (must be unique).
        phone: their phone (must be unique).
        password: an initial password for the account.
        address: their address (required by the backend).
    """
    if not API_TOKEN:
        return "[ERROR] Not configured: set BUILDER_API_TOKEN."
    missing = [n for n, v in (
        ("full_name", full_name), ("email", email), ("phone", phone),
        ("password", password), ("address", address)) if not str(v).strip()]
    if missing:
        return f"[ERROR] Missing required field(s): {', '.join(missing)}."
    code, data = await _post(EP_CREATE_USER, {
        "fullName": full_name.strip(),
        "email": email.strip(),
        "phone": phone.strip(),
        "password": password,
        "address": address.strip(),
        "type": 0,  # 0 = SubAdmin (same as the admin panel)
    })
    if code == 401:
        return "[ERROR] Auth failed (401). Refresh BUILDER_API_TOKEN."
    if code >= 400:
        msg = data.get("message") if isinstance(data, dict) else str(data)
        return f"[ERROR] Add sub-admin failed ({code}): {str(msg)[:300]}"
    return f"[OK] Sub-admin '{full_name.strip()}' ({email.strip()}) created."


@mcp.tool()
async def builder_get_images(query: str, count: int = 6) -> str:
    """Fetch real stock photo URLs (Unsplash) for a topic — use these in element
    image fields so a site gets varied, on-topic photos instead of the repeated
    placeholder. e.g. query="modern plumbing bathroom" or "gym workout".

    Args:
        query: what the photos should be of (business/niche/scene).
        count: how many URLs to return (max 10).
    """
    if not API_TOKEN:
        return "[ERROR] Not configured: set BUILDER_API_TOKEN."
    if not query.strip():
        return "[ERROR] query is required (e.g. 'plumbing service van')."
    urls = await _fetch_images(query.strip(), max(1, min(int(count or 6), 10)))
    if not urls:
        return ("[none] No images returned (check UNSPLASH_ACCESS_KEY on the backend). "
                "Use your own image URLs, or the builder will show a varied placeholder.")
    out = [f"{len(urls)} image URL(s) for '{query.strip()}':"]
    out.extend(f"  {i+1}. {u}" for i, u in enumerate(urls))
    return "\n".join(out)


@mcp.tool()
async def builder_check_config() -> str:
    """Report how this MCP server is configured (base URL + whether a token is set).
    Use this to debug connectivity before creating a site."""
    return (
        f"Builder API base : {API_BASE}\n"
        f"Business endpoint: {EP_BUSINESS}\n"
        f"Bulk endpoint    : {EP_BULK}\n"
        f"Token set        : {'yes' if API_TOKEN else 'NO (set BUILDER_API_TOKEN)'}\n"
        f"Default userId   : {USER_ID or '(none - taken from token)'}"
    )


if __name__ == "__main__":
    mcp.run()
