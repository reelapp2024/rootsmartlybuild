# Niche Analysis engines — env keys

Works **without** Pinterest/Amazon credentials (fallback mode).
Set `*_API_MODE=true` + keys only when you want official APIs.

## Already used
| Key | Purpose |
|-----|---------|
| `GOOGLE_ADS_API_MODE` | `true` = Keyword Planner volume |
| `GOOGLE_ADS_*` | Ads OAuth + developer token + customer id |
| `GOOGLE_TRENDS_MODE` | `true` = interest over time |
| `GOOGLE_API_KEY` + `GOOGLE_SEARCH_ENGINE_ID` | CSE fallback for `site:pinterest.com` / `site:amazon.com` |
| `OPENAI_API_KEY` | Estimates when Ads/official APIs off |

## Pinterest (new)
| Key | Required for official API? | Notes |
|-----|----------------------------|--------|
| `PINTEREST_API_MODE` | — | `false` = fallback (default, works now) |
| `PINTEREST_ACCESS_TOKEN` | Yes if mode true | [developers.pinterest.com](https://developers.pinterest.com/) |
| `PINTEREST_APP_ID` | Optional | Future OAuth refresh |
| `PINTEREST_APP_SECRET` | Optional | Future OAuth refresh |

**Without token:** Google CSE + OpenAI + visual keyword heuristic.

## Amazon (new)
| Key | Required for official API? | Notes |
|-----|----------------------------|--------|
| `AMAZON_API_MODE` | — | `false` = fallback (default, works now) |
| `AMAZON_PAAPI_ACCESS_KEY` | Yes if mode true | Associates → PA-API |
| `AMAZON_PAAPI_SECRET_KEY` | Yes if mode true | |
| `AMAZON_PAAPI_PARTNER_TAG` | Yes if mode true | e.g. `yourtag-20` |
| `AMAZON_PAAPI_MARKETPLACE` | Optional | Default `www.amazon.com` |
| `AMAZON_PAAPI_REGION` | Optional | Auto from marketplace |

**Without PA-API:** Amazon Suggest autocomplete (public) + CSE + OpenAI.
