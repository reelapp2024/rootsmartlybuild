const axios = require('axios');
const mongoose = require('mongoose');

const helper = require("../additional/addon");
const userProjects = require("../models/userProjects");
const websiteSections = require("../models/websiteSections");
const Service = require("../models/service")
const Country = require("../models/adminCountires")
const State = require("../models/adminStates");
const City = require("../models/adminCities");
const LocalArea = require("../models/adminLocalAreas")
const AreaServicesData = require("../models/AreaServicesData");
const AreaPagesContent = require("../models/AreaPagesContent")
const AboutUs = require("../models/aboutus")
const Slug = require("../models/slug")
const Theme = require("../models/Theme")

const WebsiteSection = require("../models/websiteSections");
const ThemeSettings = require("../models/themeSettings")

// Default theme settings (color defaults based on the theme)
const themeDefaults = {
  cleaning: {
    primary: '#00FFFF',
    secondary: '#059669',
    accent: '#34D399',
    gradient: 'from-green-600 to-emerald-600'
  },
  plumbing: {
    primary: '#3B82F6',
    secondary: '#1E40AF',
    accent: '#60A5FA',
    gradient: 'from-blue-600 to-cyan-600'
  },
  hvac: {
    primary: '#EA580C',
    secondary: '#DC2626',
    accent: '#F97316',
    gradient: 'from-orange-600 to-red-600'
  },
  roofing: {
    primary: '#64748B',
    secondary: '#475569',
    accent: '#94A3B8',
    gradient: 'from-slate-600 to-gray-600'
  },
  painting: {
    primary: '#8B5CF6',
    secondary: '#EC4899',
    accent: '#A855F7',
    gradient: 'from-purple-600 to-pink-600'
  }
};

// Simulating the default color settings if project settings are not found
const defaultColors = {
  primary: '#00FFFF',
  secondary: '#059669',
  accent: '#34D399',
  background: '#FFFFFF',
  foreground: '#0F172A',
  muted: '#F1F5F9',
  border: '#E2E8F0',
  destructive: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
  info: '#3B82F6'
};
module.exports = {

  my_projects: async (req, res) => {
    try {
      const { userId } = req.body;

      // Validate required fields
      const requiredFields = ['userId'];
      const nonRequiredFields = [];
      if (!await helper.validateFields(req.body, requiredFields, nonRequiredFields, res)) {
        return;
      }



      // Fetch projects by userId
      let my_projects = await userProjects.find({ userId }); // Use find() instead of findById()

      res.status(200).json({
        message: 'Successfully fetched projects!',
        projects: my_projects // Return valid data
      });

    } catch (error) {
      console.log(error, "Hey, this is an error");
      res.status(500).json({ error: error.message }); // Send only error message
    }
  },


  my_site: async (req, res) => {
    try {
      let { projectId, pageType, refId, _id, RefLocation, reqFrom } = req.body;

      if (!projectId) {
        return res.status(400).json({ message: "Project ID is required!" });
      }

      let slug = "";
      let info = null;
      let slugData = null;
      let showName = "";

      // 1) Resolve incoming RefLocation or refId
      if (RefLocation) {
        slugData = await Slug.findOne({ slug: RefLocation, projectId }).exec();
      } else if (refId) {
        slugData = await Slug.findOne({
          locationId: refId,
          slugType: pageType,
          projectId
        }).exec();
      }
      if (slugData) {
        refId = slugData.locationId;
        pageType = slugData.slugType;
        slug = slugData.slug;
        showName = slugData.showName;
      }

      // 2) Fetch area-specific overrides (if any)
      const areaPageContent = (projectId && refId)
        ? await AreaPagesContent.findOne({
          projectId,
          areaId: refId,

        }).lean()
        : null;




      // 3) Optionally fetch fallback lat/lng or override from areaPageContent.locInfo
      if (pageType && refId) {
        const models = { country: Country, state: State, city: City, local_area: LocalArea };
        const parents = { city: "state_id", state: "country_id", local_area: "city_id" };
        const parentType = { city: "state", state: "country", local_area: "city" };

        async function getLocationData(type, id) {
          let doc;
          if (type) {
            doc = await models[type].findOne({ id }).lean();
            if (doc && doc.lat != null && doc.lng != null) {
              return { id, name: doc.name, lat: doc.lat, lng: doc.lng, isParent: 0 };
            }
          }
          if (type && parents[type]) {
            id = doc[parents[type]];
            type = parentType[type];
            doc = await models[type].findOne({ id }).lean();
            if (doc && doc.lat != null && doc.lng != null) {
              return { id, name: doc.name, lat: doc.lat, lng: doc.lng, isParent: 1 };
            }
          }
          return null;
        }

        if (areaPageContent?.locInfo?.lat != null && areaPageContent.locInfo.lng != null) {
          info = {
            id: refId,
            name: areaPageContent.locInfo.name || showName || "",
            lat: areaPageContent.locInfo.lat,
            lng: areaPageContent.locInfo.lng,
            isParent: 0
          };
        } else {
          info = await getLocationData(pageType, refId);
        }
      }

      // 4) Ensure pageType present
      if (!pageType) {
        return res.status(400).json({ message: "pageType is required!" });
      }

      // 5) Load project and AboutUs
      const projectInfo = await userProjects.findById(projectId).lean();
      if (!projectInfo) {
        return res.status(404).json({ message: "Project not found!" });
      }
      const aboutUs = await AboutUs.findOne({ projectId });

      // 6) Apply any areaPageContent overrides onto projectInfo
      if (areaPageContent) {
        const overrideKeys = [
          'meta_title', 'meta_description', 'meta_keywords',
          'heroHeading', 'heroSubheading', 'heroImages',
          'welcomeLine', 'promiseLine',
          'cta',
          'featuresSection', 'statsSection',
          'description', 'descriptions',
          'ourGuaranteeText', 'ourGuaranteeSection', 'ourGuaranteesImage',
          'ourProcessText', 'ourProcessSection', 'ourProcessImage',
          'scheduleServiceImage',
          'whyChooseUsText', 'whyChooseUsSection', 'whyChooseUsImage',
          'steps_icons'
        ];
        for (const key of overrideKeys) {
          const val = areaPageContent[key];
          const hasOverride = Array.isArray(val)
            ? val.length > 0
            : val !== undefined && val !== null && !(typeof val === 'string' && !val.trim());
          if (hasOverride) {
            projectInfo[key] = val;
          }
        }
      }

      // 7) Compute startFrom and upcomingPage
      let startFrom = 0;
      if (projectInfo.isCountry) startFrom = 1;
      else if (projectInfo.isState) startFrom = 2;
      else if (projectInfo.isCity) startFrom = 3;
      else if (projectInfo.isLocal) startFrom = 4;

      const pageOrder = ["country", "state", "city", "local_area"];
      const flagMap = {
        country: !!projectInfo.isCountry,
        state: !!projectInfo.isState,
        city: !!projectInfo.isCity,
        local_area: !!projectInfo.isLocal
      };

      const currentIndex = pageType === "home"
        ? -1
        : pageOrder.indexOf(pageType);
      let upcomingPage = "nonextpage";

      if (pageType === "home") {
        for (const p of pageOrder) {
          if (flagMap[p]) { upcomingPage = p; break; }
        }
      } else {
        for (let i = currentIndex + 1; i < pageOrder.length; i++) {
          if (flagMap[pageOrder[i]]) {
            upcomingPage = pageOrder[i];
            break;
          }
        }
      }

      if (
        (startFrom === 1 && !flagMap.country && !flagMap.state && !flagMap.city && !flagMap.local_area) ||
        (startFrom === 2 && !flagMap.state && !flagMap.city && !flagMap.local_area) ||
        (startFrom === 3 && !flagMap.city && !flagMap.local_area)
      ) {
        upcomingPage = "nonextpage";
      }

      // 8) Build locations, unparentedlocations, services, faq, testimonials
      let locations = [];
      let unparentedlocations = [];
      let services = [];
      let faq = [];
      let testimonials = [];

      const mapLocal = l => ({
        localAreaId: l.localAreaId,
        name: l.name,
        status: l.status ?? 1,
        location_id: l.localAreaId,
        slugType: "local_area"
      });

      if (pageType === "home") {
        if (startFrom === 1 && projectInfo.isCountry) {
          const ids = projectInfo.locations.country.filter(c => c.status).map(c => c.countryId);
          const docs = await Country.find({ id: { $in: ids } })
            .select("id sortname").lean();
          const sMap = new Map(docs.map(d => [d.id.toString(), d.sortname]));
          locations = projectInfo.locations.country
            .filter(c => c.status)
            .map(c => ({
              countryId: c.countryId,
              name: c.name,
              location_id: c.countryId,
              sortname: sMap.get(c.countryId.toString()) || "",
              slugType: "country"
            }));
        } else if (startFrom === 2 && projectInfo.isState) {
          locations = projectInfo.locations.state
            .filter(s => s.status)
            .map(s => ({
              stateId: s.stateId,
              name: s.name,
              location_id: s.stateId,
              slugType: "state"
            }));
        } else if (startFrom === 3 && projectInfo.isCity) {
          locations = projectInfo.locations.city
            .filter(c => c.status)
            .map(c => ({
              cityId: c.cityId,
              name: c.name,
              location_id: c.cityId,
              slugType: "city"
            }));
        } else if (startFrom === 4 && projectInfo.isLocal) {
          locations = projectInfo.locations.localArea
            .filter(l => l.status)
            .map(mapLocal);
        }

        services = await Service.find({ projectId })
          .select("_id service_name fas_fa_icon service_description")
          .limit(90);

        const homeSecs = await websiteSections.find({ projectId, referencePage: "homepage" });
        faq = homeSecs.filter(s => s.sectionTitle === "FAQ")
          .flatMap(s => s.sectionContent).slice(0, 5);
        testimonials = homeSecs.filter(s => s.sectionTitle === "Reviews")
          .flatMap(s => s.sectionContent).slice(0, 5);

      } else {
        if (pageType === "country") {
          const cid = refId.toString();
          locations = projectInfo.locations.state
            .filter(s => s.status && s.countryId.toString() === cid)
            .map(s => ({
              stateId: s.stateId,
              name: s.name,
              location_id: s.stateId,
              slugType: "state"
            }));
          const zero = projectInfo.locations.country
            .filter(c => !c.status)
            .map(c => c.countryId.toString());
          unparentedlocations = projectInfo.locations.state
            .filter(s => zero.includes(s.countryId.toString()))
            .map(s => ({
              stateId: s.stateId,
              name: s.name,
              location_id: s.stateId,
              slugType: "state"
            }));

        } else if (pageType === "state") {
          const sid = refId.toString();
          locations = projectInfo.locations.city
            .filter(c => c.status && c.stateId.toString() === sid)
            .map(c => ({
              cityId: c.cityId,
              name: c.name,
              location_id: c.cityId,
              slugType: "city"
            }));
          const zero = projectInfo.locations.state
            .filter(s => !s.status)
            .map(s => s.stateId.toString());
          unparentedlocations = projectInfo.locations.city
            .filter(c => zero.includes(c.stateId.toString()))
            .map(c => ({
              cityId: c.cityId,
              name: c.name,
              location_id: c.cityId,
              slugType: "city"
            }));

        } else if (pageType === "city") {
          const cid = refId.toString();
          locations = projectInfo.locations.localArea
            .filter(l => l.status && l.cityId.toString() === cid)
            .map(mapLocal);
          const zero = projectInfo.locations.city
            .filter(c => !c.status)
            .map(c => c.cityId.toString());
          unparentedlocations = projectInfo.locations.localArea
            .filter(l => zero.includes(l.cityId.toString()))
            .map(mapLocal);

        } else if (pageType === "local_area") {
          locations = projectInfo.locations.localArea
            .filter(l => l.status && l.localAreaId === refId)
            .map(mapLocal);
          const zero = projectInfo.locations.city
            .filter(c => !c.status)
            .map(c => c.cityId.toString());
          unparentedlocations = projectInfo.locations.localArea
            .filter(l => zero.includes(l.cityId.toString()))
            .map(mapLocal);
        }

        services = await Service.find({ projectId })
          .select("_id service_name fas_fa_icon service_description")
          .limit(90);

        const faqSec = await websiteSections.findOne({
          projectId,
          sectionTitle: "FAQ",
          referencePage: refId
        });
        faq = faqSec ? faqSec.sectionContent : [];

        const revSec = await websiteSections.findOne({
          projectId,
          sectionTitle: "Reviews",
          referencePage: refId
        });
        testimonials = revSec ? revSec.sectionContent : [];
      }

      // 9) Attach slugs to locations
      if (locations.length) {
        let slugTypes;
        if (pageType === "home") slugTypes = ["country", "state", "city", "local_area"];
        else if (pageType === "country") slugTypes = ["state"];
        else if (pageType === "state") slugTypes = ["city"];
        else if (pageType === "city") slugTypes = ["local_area"];
        else slugTypes = [];

        const ids = locations.map(l => l.location_id);
        const dbSlugs = await Slug.find({
          locationId: { $in: ids },
          slugType: { $in: slugTypes },
          projectId
        })
          .select("locationId slug")
          .lean();

        const slugMap = new Map(dbSlugs.map(s => [s.locationId, s.slug]));
        locations = locations.map(loc => ({
          ...loc,
          slug: slugMap.get(loc.location_id) || ""
        }));
      }


      if (reqFrom === "contact") {
        const contactFaqDoc = await websiteSections.findOne({
          projectId,
          sectionTitle: "FAQ",
          referencePage: "contact"
        });
        faq = contactFaqDoc ? contactFaqDoc.sectionContent : [];
      }


      // 10) Final response
      return res.status(200).json({
        message: "Data fetched successfully!",
        projectInfo,
        aboutUs,
        locations,
        unparentedlocations,
        services,
        faq,
        testimonials,
        startFrom,
        upcomingPage,
        RefLocation,
        slug,
        showName,
        info
      });
    } catch (error) {
      console.error("Error in mySite API:", error);
      return res.status(500).json({ error: error.message });
    }
  },
  basic_project_info: async (req, res) => {
    try {
      const { projectId } = req.body;

      if (!projectId) {
        return res.status(400).json({ message: "Project ID is required!" });
      }

      // Fetch only required fields from userProjects
      const projectInfo = await userProjects.findById(projectId)
        .select("serviceType projectName descriptions")
        .lean();

      if (!projectInfo) {
        return res.status(404).json({ message: "Project not found!" });
      }

      const aboutUs = await AboutUs.findOne({ projectId }).lean();


      // Return only needed info
      return res.status(200).json({
        message: "Basic project info fetched successfully!",
        serviceType: projectInfo.serviceType,
        projectName: projectInfo.projectName,
        descriptions: projectInfo.descriptions || [],
        aboutUs: aboutUs
      });

    } catch (error) {
      console.error("Error in basicProjectInfo API:", error);
      return res.status(500).json({ error: error.message });
    }
  },


  area_we_serve: async (req, res) => {
    try {
      const { projectId, pageType, refId } = req.body;


      if (!projectId || !pageType || !refId) {
        return res.status(400).json({ message: "projectId, pageType, and refId are required!" });
      }

      const projectInfo = await userProjects.findById(projectId).lean();
      if (!projectInfo) {
        return res.status(404).json({ message: "Project not found!" });
      }

      let locations = [];
      let locationsType = "children";

      const idKeyMap = {
        country: "countryId",
        state: "stateId",
        city: "cityId",
        local_area: "localAreaId"
      };

      const pageConfig = {
        country: {
          childKey: "state",
          parentArray: projectInfo.locations.country,
          childArray: projectInfo.locations.state,
          parentIdKey: null,
          childIdKey: "countryId",
          childMap: s => ({
            stateId: s.stateId,
            name: s.name,
            location_id: s.stateId,
            slugType: "state",
            locationType: "state"
          }),
          siblingMap: c => ({
            countryId: c.countryId,
            name: c.name,
            location_id: c.countryId,
            slugType: "country",
            locationType: "country"
          })
        },
        state: {
          childKey: "city",
          parentArray: projectInfo.locations.state,
          childArray: projectInfo.locations.city,
          parentIdKey: "countryId",
          childIdKey: "stateId",
          childMap: c => ({
            cityId: c.cityId,
            name: c.name,
            location_id: c.cityId,
            slugType: "city",
            locationType: "city"
          }),
          siblingMap: s => ({
            stateId: s.stateId,
            name: s.name,
            location_id: s.stateId,
            slugType: "state",
            locationType: "state"
          })
        },
        city: {
          childKey: "local_area",
          parentArray: projectInfo.locations.city,
          childArray: projectInfo.locations.localArea,
          parentIdKey: "stateId",
          childIdKey: "cityId",
          childMap: l => ({
            localAreaId: l.localAreaId,
            name: l.name,
            location_id: l.localAreaId,
            slugType: "local_area",
            locationType: "local_area"
          }),
          siblingMap: c => ({
            cityId: c.cityId,
            name: c.name,
            location_id: c.cityId,
            slugType: "city",
            locationType: "city"
          })
        },
        local_area: {
          childKey: null,
          parentArray: projectInfo.locations.localArea,
          childArray: [],
          parentIdKey: "cityId",
          childIdKey: "localAreaId",
          childMap: () => ({}),
          siblingMap: l => ({
            localAreaId: l.localAreaId,
            name: l.name,
            location_id: l.localAreaId,
            slugType: "local_area",
            locationType: "local_area"
          })
        }
      };

      const config = pageConfig[pageType];
      if (!config) {
        return res.status(400).json({ message: "Invalid pageType" });
      }

      const currentItem = config.parentArray.find(p =>
        p[(config.childIdKey || idKeyMap[pageType])]?.toString() === refId.toString()
      );
      const currentParentId = currentItem ? currentItem[config.parentIdKey] : null;

      // 1) Try getting child locations if childArray exists
      if (config.childArray && config.childArray.length > 0) {
        locations = config.childArray
          .filter(item =>
            item.status &&
            item[config.childIdKey]?.toString() === refId.toString()
          )
          .map(config.childMap);
      }

      // 2) If no children found, fallback to siblings (same parentId if applicable)
      if (locations.length === 0) {
        locationsType = "siblings";

        locations = config.parentArray
          .filter(p =>
            p.status &&
            p[(config.childIdKey || idKeyMap[pageType])]?.toString() !== refId.toString() &&
            (config.parentIdKey
              ? p[config.parentIdKey]?.toString() === currentParentId?.toString()
              : true)
          )
          .map(config.siblingMap);

        // 3) If siblings still empty, fallback to parent
        if (locations.length === 0 && config.parentIdKey && currentParentId) {
          const parentConfig = Object.values(pageConfig).find(pc => pc.childKey === pageType);
          if (parentConfig) {
            const parentLocation = parentConfig.parentArray.find(pl =>
              pl[parentConfig.childIdKey]?.toString() === currentParentId.toString()
            );
            if (parentLocation) {
              locationsType = "parent";
              locations = [{
                name: parentLocation.name,
                location_id: parentLocation[parentConfig.childIdKey],
                slugType: parentConfig.childKey,
                locationType: parentConfig.childKey
              }];
            }
          }
        }
      }

      // 4) Attach slugs efficiently using composite queries
      if (locations.length) {
        // Build unique combinations of (location_id, slugType)
        const slugQueryConditions = locations.map(loc => ({
          locationId: loc.location_id,
          slugType: loc.slugType,
          projectId
        }));

        const dbSlugs = await Slug.find({
          $or: slugQueryConditions
        }).select("locationId slug slugType").lean();

        const slugMap = new Map(
          dbSlugs.map(s => [`${s.locationId}-${s.slugType}`, s.slug])
        );

        locations = locations.map(loc => ({
          ...loc,
          slug: slugMap.get(`${loc.location_id}-${loc.slugType}`) || ""
        }));
      }



      return res.status(200).json({
        message: "Locations fetched successfully",
        locationsType,
        locations
      });

    } catch (error) {
      console.error("Error in area_we_serve API:", error);
      return res.status(500).json({ error: error.message });
    }
  },

  slugToPageType: async (req, res) => {
    try {
      const { projectId, slug } = req.body;
      if (!projectId || !slug) {
        return res.status(400).json({ message: 'projectId and slug are required' });
      }

      // look up the slug entry for this project
      const entry = await Slug.findOne({ projectId, slug })
        .select('slugType locationId showName slugType')
        .lean();



      if (!entry) {
        return res.status(404).json({ message: 'Slug not found for this project' });
      }

      return res.status(200).json({
        slugType: entry.slugType,
        locationId: entry.locationId,
        showName: entry.showName,
        slugType: entry.slugType
      });
    } catch (err) {
      console.error('Error in slugToPageType:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  location_info: async (req, res) => {
    try {
      const { locationId, locationType } = req.body;

      if (!locationId || !locationType) {
        return res.status(400).json({ message: "locationId and locationType are required" });
      }

      const validTypes = ['country', 'state', 'city', 'localArea'];
      if (!validTypes.includes(locationType)) {
        return res.status(400).json({ message: "Invalid locationType" });
      }

      // Build query dynamically
      const query = {};
      query[`locations.${locationType}`] = { $elemMatch: { [`${locationType}Id`]: locationId } };

      const project = await userProjects.findOne(query).lean();

      if (!project) {
        return res.status(404).json({ message: "Location not found" });
      }

      const locationList = project.locations[locationType];
      const locationData = locationList.find(loc => loc[`${locationType}Id`] === locationId);

      if (!locationData) {
        return res.status(404).json({ message: "Location data not found" });
      }

      const response = {
        name: locationData.name,
        lat: locationData.lat,
        lng: locationData.lng,
        bounds: locationData.bounds || null
      };

      return res.status(200).json({ success: true, data: response });

    } catch (err) {
      console.error("Error fetching location:", err);
      return res.status(500).json({ message: "Server error" });
    }
  },

  projectinfo: async (req, res) => {
    try {
      const { ProjectId } = req.body;

      // Validate required fields
      const requiredFields = ['ProjectId'];
      const nonRequiredFields = [];
      if (!await helper.validateFields(req.body, requiredFields, nonRequiredFields, res)) {
        return;
      }



      // Fetch projects by userId
      let projectInfo = await userProjects.findById(ProjectId); // Use find() instead of findById()

      res.status(200).json({
        message: 'Successfully fetched project info!',
        projectInfo: projectInfo // Return valid data
      });

    } catch (error) {
      console.log(error, "Hey, this is an error");
      res.status(500).json({ error: error.message }); // Send only error message
    }
  },

  fetchTnC_Au_Pp: async (req, res) => {
    try {
      const { projectId } = req.body;

      if (!projectId) {
        return res.status(400).json({ message: 'Project ID is required' });
      }

      // Fetch the sections for the given projectId
      const privacyPolicyContent = await websiteSections.findOne({
        projectId: projectId,
        sectionTitle: 'privacyPolicyContent'
      });

      const termsAndConditionsContent = await websiteSections.findOne({
        projectId: projectId,
        sectionTitle: 'termsAndConditionsContent'
      });

      const aboutUsContent = await websiteSections.findOne({
        projectId: projectId,
        sectionTitle: 'aboutUsContent'
      });

      if (!privacyPolicyContent || !termsAndConditionsContent || !aboutUsContent) {
        return res.status(404).json({ message: 'Content not found for the provided projectId' });
      }



      // Return the content
      return res.json({
        privacyPolicy: privacyPolicyContent.sectionContent,
        termsAndConditions: termsAndConditionsContent.sectionContent,
        aboutUs: aboutUsContent.sectionContent,
      });
    } catch (error) {
      console.error('Error fetching content:', error);
      return res.status(500).json({ message: 'Error fetching content' });
    }
  },

  fetch_services: async (req, res) => {
    try {
      const { projectId, areaId, areaType } = req.body; // NEW: read areaId/areaType

      console.log(req.body, "--re.boy of fet sev")

      if (!projectId) {
        return res.status(400).json({ message: 'Project ID is required' });
      }

      let project_info = await userProjects.findById(projectId).lean();

      if (!project_info) {
        return res.status(400).json({ message: 'Project with this ID not exists' });
      }

      // helper to pick your start page
      function determineStartFrom(flags) {
        if (flags.isCountry === 1) return 'country';
        if (flags.isState === 1) return 'state';
        if (flags.isCity === 1) return 'city';
        if (flags.isLocal === 1) return 'local_area';
        return 'homepage';
      }

      // use it:
      const startFrom = determineStartFrom(project_info);

      // Fetch the `locations` array when rendering the “home” page
      let locations = [];

      if (project_info.isCountry === 1) {
        // Start from Country
        locations = project_info.locations.country.map(({ countryId, name }) => ({
          countryId,
          name,
          location_id: countryId
        }));
      }
      else if (project_info.isState === 1) {
        // Start from State
        locations = project_info.locations.state.map(({ stateId, name }) => ({
          stateId,
          name,
          location_id: stateId
        }));
      }
      else if (project_info.isCity === 1) {
        // Start from City
        locations = project_info.locations.city.map(({ cityId, name }) => ({
          cityId,
          name,
          location_id: cityId
        }));
      }
      else if (project_info.isLocal === 1) {
        // Start from Local Area
        locations = project_info.locations.localArea.map(({ localAreaId, name, _id }) => ({
          localAreaId,
          name,
          _id,
          location_id: localAreaId
        }));
      }

      // Fetch the sections for the given projectId (UNCHANGED)
      const services = await Service.find({ projectId, is_main: true })
        .select('_id service_name fas_fa_icon service_description images')
        .limit(90);

      let selectedArray = [];
      var locationType;

      if (project_info.locations.country && project_info.locations.country.length > 0) {
        selectedArray = project_info.locations.country;
        locationType = "country";
      } else if (project_info.locations.state && project_info.locations.state.length > 0) {
        selectedArray = project_info.locations.state;
        locationType = "state";
      } else if (project_info.locations.city && project_info.locations.city.length > 0) {
        selectedArray = project_info.locations.city;
        locationType = "city";
      } else if (project_info.locations.localArea && project_info.locations.localArea.length > 0) {
        selectedArray = project_info.locations.localArea;
        locationType = "localArea";
      }

      // Now, selectedArray contains the relevant data based on availability.

      let imgurl = `https://images.unsplash.com/photo-1520966347624-b86c3042b3b2?ixid=M3w2NzgzMDJ8MHwxfHNlYXJjaHw3fHxJbWFnZXMlMjBvZiUyMENhbmR5JTIwc2hvcHN8ZW58MHx8fHwxNzM2NzY4MzQzfDA&ixlib=rb-4.0.3?w=1200&h=800&fit=crop`;
      if (project_info) {
        if (project_info.images[2])
          if (project_info.images[2].url) {
            imgurl = project_info.images[2].url;
          }
      }

      // -------------------- NEW: area-aware enrichment (non-breaking) --------------------
      // Always compute locationName key; empty string if not provided or not found.
      let locationName = "";

      // Resolve a human name for the given areaId/areaType
      if (areaId && areaType) {
        if (areaType === "country") {
          const country = await Country.findOne({ id: areaId }).lean();
          locationName = country?.name || "";
        } else if (areaType === "state") {
          const state = await State.findOne({ id: areaId }).lean();
          locationName = state?.name || "";
        } else if (areaType === "city") {
          const city = await City.findOne({ id: areaId }).lean();
          locationName = city?.name || "";
        } else if (areaType === "local_area") {
          const area = await LocalArea.findOne({ id: areaId }).lean();
          locationName = area?.name || "";
        }
      }

      // If areaId/areaType were sent, load overrides for ALL returned services in one shot
      let overridesByServiceId = new Map();
      if (areaId && areaType && services.length > 0) {
        const serviceIds = services.map(s => s._id);
        const overrides = await AreaServicesData.find({
          serviceId: { $in: serviceIds },
          areaId,
          areaType
        })
          .select('serviceId service_description') // we only need this key for now
          .lean();

        overrides.forEach(ov => {
          overridesByServiceId.set(String(ov.serviceId), ov);
        });
      }

      // Build the final services array WITHOUT changing the original query semantics
      const servicesOut = services.map(doc => {
        const s = doc.toObject ? doc.toObject() : doc; // keep shape
        const idStr = String(s._id);

        // Prefer area-specific service_description when available and non-empty
        const ov = overridesByServiceId.get(idStr);
        if (ov && typeof ov.service_description === 'string' && ov.service_description.trim() !== '') {
          s.service_description = ov.service_description;
        }

        // If we have a resolved location name, suffix service_name with " in <location>"
        if (locationName && typeof s.service_name === 'string' && s.service_name.trim() !== '') {
          s.service_name = `${s.service_name} in ${locationName}`;
        }

        return s;
      });
      // -------------------- END NEW --------------------
      console.log(servicesOut,"Hellloooooooooooooooooooooooo");

      // Return the content (UNCHANGED structure) + NEW top-level locationName
      return res.json({
        services: servicesOut,                // <- same key, enriched when applicable
        locations: locations,
        startFrom: startFrom,
        serviceType: project_info.serviceType,
        projectLocations: selectedArray,
        locationType: locationType,
        projectImage: imgurl,
        locationName: locationName           // NEW: always present; "" if not resolved or not sent
      });
    } catch (error) {
      console.error('Error fetching content:', error);
      return res.status(500).json({ message: 'Error fetching content' });
    }
  },
  fetch_random_services: async (req, res) => {
    try {
      const { projectId } = req.body;
      console.log(req.body)

      if (!projectId) {
        return res.status(400).json({ message: 'Project ID is required' });
      }

      let project_info = await userProjects.findById(projectId).lean();

      if (!project_info) {
        return res.status(400).json({ message: 'Project with this ID not exists' });
      }

      // Fetch 4 random services for the given projectId
      const allServices = await Service.find({ projectId, is_main: true })
        .select('_id service_name fas_fa_icon service_description images');

      const shuffled = allServices.sort(() => 0.5 - Math.random());
      const services = shuffled.slice(0, 4);




      // Return the services
      return res.json({
        services: services
      });
    } catch (error) {
      console.error('Error fetching recommended services:', error);
      return res.status(500).json({ message: 'Error fetching recommended services' });
    }
  },

  fetch_faq_reviews: async (req, res) => {
    try {
      const { projectId } = req.body;

      if (!projectId) {
        return res.status(400).json({ message: 'Project ID is required' });
      }

      let project_info = await userProjects.findById(projectId).lean();

      if (!project_info) {
        return res.status(400).json({ message: 'Project with this ID not exists' });
      }


      const websiteSection = await websiteSections.find({ projectId, referencePage: "homepage" });
      let faq = websiteSection
        .filter(s => s.sectionTitle === "FAQ")
        .flatMap(s => s.sectionContent)
        .slice(0, 5);
      let testimonials = websiteSection
        .filter(s => s.sectionTitle === "Reviews")
        .flatMap(s => s.sectionContent)
        .slice(0, 5);





      // Return the content
      return res.json({
        testimonials,
        faq

      });
    } catch (error) {
      console.error('Error fetching content:', error);
      return res.status(500).json({ message: 'Error fetching content' });
    }
  },

  fetch_ordered_services: async (req, res) => {
    try {
      const { projectId } = req.body;
      if (!projectId) {
        return res.status(400).json({ message: 'Project ID is required' });
      }

      // 1) Verify project exists
      const project_info = await userProjects
        .findById(projectId)
        .lean()
        .select('_id projectName fas_fa_icon');
      if (!project_info) {
        return res
          .status(400)
          .json({ message: 'Project with this ID does not exist' });
      }

      // 2) Aggregation: match → sort → group → sort buckets → project shape
      const services = await Service.aggregate([
        {
          $match: {
            projectId: new mongoose.Types.ObjectId(projectId),
            is_main: true,
          }
        },
        {
          $project: {
            // include only these fields in the pipeline
            _id: 1,
            service_name: 1,
            fas_fa_icon: 1,
            // compute uppercase first letter
            firstLetter: {
              $toUpper: { $substr: ["$service_name", 0, 1] }
            }
          }
        },
        { $sort: { service_name: 1 } },    // A→Z overall
        {
          $group: {
            _id: "$firstLetter",
            services: {
              $push: {
                _id: "$_id",
                service_name: "$service_name",
                fas_fa_icon: "$fas_fa_icon"
              }
            }
          }
        },
        { $sort: { _id: 1 } },             // A→Z buckets
        {
          $project: {
            _id: 0,
            letter: "$_id",
            services: 1
          }
        }
      ]);

      // 3) Send down project + grouped services
      return res.json({
        project_info,
        services
      });

    } catch (error) {
      console.error('Error fetching services:', error);
      return res.status(500).json({ message: 'Error fetching services' });
    }
  },
  fetch_service: async (req, res) => {
    try {
      const { serviceId, areaId, areaType } = req.body;

      if (!serviceId) {
        return res.status(400).json({ message: 'Service ID is required' });
      }

      // 1) Fetch area-specific overrides (if any)
      let areaData = null;
      if (areaId && areaType) {
        areaData = await AreaServicesData.findOne({
          serviceId: new mongoose.Types.ObjectId(serviceId),
          areaId,
          areaType
        }).lean();
      }

      // 2) Fetch the base service
      const service = await Service.findById(serviceId).lean();
      if (!service) {
        return res.status(404).json({ message: 'Service not found' });
      }

      // 3) Merge with preference to areaData
      const fields = [
        'meta_title',
        'meta_description',
        'meta_keywords',
        'meta_image',

        'service_description',
        'about_service',
        'whyChooseUsHeading',
        'whyChooseUsText',
        'whyChooseUsSection',
        'comprehensiveCoverageText',
        'customSolutionText',

        'steps_process',
        'ourGuaranteeText',
        'ourGuaranteeSection',
        'promiseLine',

        'subServices',
        'serviceGroups',
      ];

      const merged = { ...service };
      for (const key of fields) {
        if (areaData != null && Array.isArray(areaData[key]) && areaData[key].length > 0) {
          merged[key] = areaData[key];
        } else if (areaData != null && typeof areaData[key] === 'string' && areaData[key].trim() !== '') {
          merged[key] = areaData[key];
        }
        // else keep base service[key]
      }

      // 4) load CTAs
      const project = await userProjects
        .findById(service.projectId)
        .select('cta')
        .lean();
      const projectCtas = Array.isArray(project?.cta) ? project.cta : [];
      const sequenceNums = (service.ctaSequence || []).map(o => o.ctanumber);
      const orderedCtas = sequenceNums.map(num =>
        projectCtas.find(c => c.serialno === num) || null
      );
      const [cta1, cta2, cta3, cta4] = orderedCtas;

      // 5) FAQs (area-aware with fallback)
      let faq = [];
      if (areaData?._id) {
        const faqAreaSection = await WebsiteSection.findOne({
          referencePage: areaData._id,            // <-- AreaServicesData _id
          sectionTitle: 'FAQSERVICEAREA'
        }).lean();
        if (faqAreaSection?.sectionContent) {
          faq = faqAreaSection.sectionContent;
        }
      }
      if (faq.length === 0) {
        // fallback to base service FAQs
        const faqBaseSection = await WebsiteSection.findOne({
          referencePage: new mongoose.Types.ObjectId(serviceId),
          sectionTitle: 'FAQSERVICE'
        }).lean();
        faq = faqBaseSection?.sectionContent || [];
      }

      // 6) Reviews (NEW) — area-aware with fallback
      let testimonials = [];
      if (areaData?._id) {
        const reviewsAreaSection = await WebsiteSection.findOne({
          referencePage: areaData._id,           // <-- AreaServicesData _id
          sectionTitle: 'REVIEWSERVICEAREA'
        }).lean();
        if (reviewsAreaSection?.sectionContent) {
          testimonials = reviewsAreaSection.sectionContent;
        }
      }
      if (testimonials.length === 0) {
        // fallback to base service reviews
        const reviewsBaseSection = await WebsiteSection.findOne({
          referencePage: new mongoose.Types.ObjectId(serviceId),
          sectionTitle: 'REVIEWSERVICE'
        }).lean();
        testimonials = reviewsBaseSection?.sectionContent || [];
      }

      // 7) Return
      return res.json({
        service: merged,
        cta1, cta2, cta3, cta4,
        faq,
        testimonials   // <-- NEW key
      });
    }
    catch (error) {
      console.error('Error fetching service:', error);
      return res.status(500).json({ message: 'Error fetching service data' });
    }
  },


  theme: async (req, res) => {
    try {
      const { projectId } = req.body;

      if (!projectId) {
        return res.status(400).json({ message: "projectId is required" });
      }

      const themeSettings = await ThemeSettings.findOne({ projectId });

      // Defaults if nothing saved yet
      const DEFAULT_THEME_NAME = "cleaning";
      const DEFAULT_SUB_COLOR = "gold";

      if (!themeSettings || !themeSettings.theme) {
        return res.json({
          theme: DEFAULT_THEME_NAME,
          themeSubColor: DEFAULT_SUB_COLOR
        });
      }

      // themeSettings.theme now stores the Theme _id
      const themeDoc = await Theme.findById(themeSettings.theme).select('themeName').lean();

      return res.json({
        theme: themeDoc?.themeName || DEFAULT_THEME_NAME,
        themeSubColor: themeSettings.themeSubColor || DEFAULT_SUB_COLOR
      });

    } catch (error) {
      console.error('Error fetching theme:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  fetch_service_by_name_and_project: async (req, res) => {
    try {
      const { serviceName, projectId } = req.body;

      console.log(req.body, "--req.body in fetch_service_by_name_and_project");



      // Validate input
      if (!serviceName || !projectId) {
        return res.status(400).json({ message: 'serviceName and projectId are required' });
      }

      // Fetch the service using serviceName and projectId
      // Normalize the incoming name: lowercase and remove spaces/hyphens
      const normalizedInput = serviceName.toLowerCase().replace(/[-\s]+/g, '');

      // Fetch all services for that project, then compare normalized names
      const services = await Service.find({ projectId }).lean();

      const service = services.find(s => {
        const normalizedDbName = s.service_name.toLowerCase().replace(/[-\s]+/g, '');
        return normalizedDbName === normalizedInput;
      });

      // Check if the service exists
      if (!service) {
        return res.status(404).json({ message: 'Service not found for given serviceName and projectId' });
      }

      // Return the service data
      return res.json({ serviceId: service._id });
    } catch (error) {
      console.error('Error fetching service:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },
  getfooter: async (req, res) => {
    try {
      const { projectId } = req.body;
      if (!projectId) {
        return res.status(400).json({ message: "Project ID is required!" });
      }

      // 1) Pull only the footer-fields from the project
      const proj = await userProjects
        .findById(projectId)
        .select("projectName projectSlogan welcomeLine defaultFasFaIcon")
        .lean();
      if (!proj) {
        return res.status(404).json({ message: "Project not found!" });
      }

      // 2) Pull AboutUs
      const aboutUs = await AboutUs.findOne({ projectId }).lean();
      if (!aboutUs) {
        return res
          .status(404)
          .json({ message: "No AboutUs entry found for this project!" });
      }

      // 3) Fetch all “main” services
      const allServices = await Service.find({ projectId, is_main: true })
        .select("_id service_name fas_fa_icon service_description images")
        .limit(90);

      // 4) Select up to 5 by odd-index first, then even, then mix
      const oddServices = allServices.filter((_, idx) => idx % 2 === 0); // 1st,3rd,5th…
      const evenServices = allServices.filter((_, idx) => idx % 2 === 1); // 2nd,4th,6th…
      let services = [];

      if (oddServices.length >= 5) {
        services = oddServices.slice(0, 5);
      } else if (evenServices.length >= 5) {
        services = evenServices.slice(0, 5);
      } else {
        services = oddServices.concat(evenServices).slice(0, 5);
      }

      // 5) Return minimal footer payload
      return res.status(200).json({
        projectName: proj.projectName,
        projectSlogan: proj.projectSlogan,
        welcomeLine: proj.welcomeLine,
        defaultFasFaIcon: proj.defaultFasFaIcon,
        aboutUs,   // full AboutUs doc
        services,  // up to 5 picked as required
      });
    } catch (error) {
      console.error("Error in getfooter:", error);
      return res.status(500).json({ error: error.message });
    }
  },

  getheader: async (req, res) => {
    try {
      const { projectId } = req.body;
      if (!projectId) {
        return res.status(400).json({ message: "Project ID is required!" });
      }


      // 1) Pull necessary fields from the project
      const proj = await userProjects
        .findById(projectId)
        .select("projectName projectSlogan welcomeLine defaultFasFaIcon location isCountry isState isCity isLocal locations")
        .lean();

      const about = await AboutUs
        .findOne({ projectId })
        .select("phone")
        .lean();

      if (!proj) {
        return res.status(404).json({ message: "Project not found!" });
      }

      // 2) Determine location type (hierarchy: country -> state -> city -> local_area)
      let locations = [];
      if (proj.isCountry) {
        // If the project is marked as having a country, fetch countries
        locations = proj.locations.country
          .filter(c => c.status)
          .map(c => ({
            countryId: c.countryId,
            name: c.name,
            location_id: c.countryId,
            slugType: "country"
          }));
      } else if (proj.isState) {
        // If the project is marked as having a state, fetch states
        locations = proj.locations.state
          .filter(s => s.status)
          .map(s => ({
            stateId: s.stateId,
            name: s.name,
            location_id: s.stateId,
            slugType: "state"
          }));
      } else if (proj.isCity) {
        // If the project is marked as having a city, fetch cities
        locations = proj.locations.city
          .filter(c => c.status)
          .map(c => ({
            cityId: c.cityId,
            name: c.name,
            location_id: c.cityId,
            slugType: "city"
          }));
      } else if (proj.isLocal) {
        // If the project is marked as having a local area, fetch local areas
        locations = proj.locations.localArea
          .filter(l => l.status)
          .map(l => ({
            localAreaId: l.localAreaId,
            name: l.name,
            location_id: l.localAreaId,
            slugType: "local_area"
          }));
      } else {
        return res.status(400).json({ message: "No valid location type found!" });
      }

      // 3) Fetch services (up to 10)
      const services = await Service.find({ projectId })
        .select("_id service_name fas_fa_icon service_description images")
        .limit(10);

      if (services.length === 0) {
        return res.status(404).json({ message: "No services found for this project!" });
      }

      // 4) Attach slugs for each location
      if (locations.length) {
        let slugTypes;
        if (proj.isCountry) slugTypes = ["country"];
        else if (proj.isState) slugTypes = ["state"];
        else if (proj.isCity) slugTypes = ["city"];
        else if (proj.isLocal) slugTypes = ["local_area"];
        else slugTypes = [];

        const ids = locations.map(l => l.location_id);
        const dbSlugs = await Slug.find({
          locationId: { $in: ids },
          slugType: { $in: slugTypes },
          projectId
        })
          .select("locationId slug")
          .lean();

        const slugMap = new Map(dbSlugs.map(s => [s.locationId, s.slug]));
        locations = locations.map(loc => ({
          ...loc,
          slug: loc.slugType ? slugMap.get(loc.location_id) || "" : slugMap.get(loc.location_id) || ""
        }));
      }

      // 5) Return the final response
      return res.status(200).json({
        message: "Data fetched successfully!",
        projectInfo: {
          ...proj,
          phoneNumber: about?.phone || null
        },
        services,
        locations, // Only the relevant parent location
      });

    } catch (error) {
      console.error("Error in getheader:", error);
      return res.status(500).json({ error: error.message });
    }
  },

  fetchSiteSettings: async (req, res) => {
    try {
      const { projectId } = req.body;


      if (!projectId) {
        return res.status(400).json({ message: "Project ID is required" });
      }

      // Fetch the color settings from the themeSettings model based on projectId
      const themeSettings = await ThemeSettings.findOne({ projectId });

      if (!themeSettings) {
        return res.status(404).json({ message: "Color settings not found for the provided project" });
      }

      // Get the theme from the themeSettings, or use 'cleaning' as the default if not available
      const theme = themeSettings.theme || 'cleaning';

      // Get theme-specific colors (based on your themeDefaults)
      const themeSpecificColors = themeDefaults[theme] || themeDefaults.cleaning;

      // Start merging the colors
      const mergedColors = { ...defaultColors };

      // Add project-specific colors (only overwrite existing colors if necessary)
      themeSettings.colors.forEach(({ key, value }) => {
        // Check if the value is a linear gradient and preserve it
        if (value.includes('linear-gradient')) {
          mergedColors[key] = value;
        } else {
          // For regular colors, merge as normal
          mergedColors[key] = value;
        }
      });

      // Add theme-specific colors without overwriting gradients
      Object.entries(themeSpecificColors).forEach(([key, value]) => {
        // Only override if no gradient or color has been set already
        if (!mergedColors[key]) {
          mergedColors[key] = value;
        }
      });

      // Log the colors in the console with visual background for each key-value pair

      // Combine the final settings with the colors and theme
      const settings = {
        colors: mergedColors,
        theme
      };

      // Return the final settings in the response
      return res.status(200).json({
        message: 'Site settings fetched successfully',
        settings
      });
    } catch (error) {
      console.error("Error fetching site settings:", error);
      return res.status(500).json({ message: "Server error while fetching site settings" });
    }
  }

}