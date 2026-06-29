const UserProject = require('../models/userProjects');
const Service = require('../models/service');

/**
 * Extract hero data from elementIds array
 * Looks for: title (projectName), text (description), background-image (image)
 * @param {Array} elementIds - Array of element objects from WebsiteDesignsData
 * @returns {Object} Hero data object with projectName, image, description, icon
 */
function extractHeroDataFromElements(elementIds) {
    const heroData = {
        projectName: '',
        image: null,
        description: '',
        icon: 'fas fa-star'
    };

    // Recursive function to extract data from elements
    const extractFromElement = (element) => {
        if (!element) return;

        // Extract from title element
        if (element.elementId === 'title' && element.data) {
            heroData.projectName = element.data.text || element.data.heading || element.data.projectName || '';
        }

        // Extract from text element
        if (element.elementId === 'text' && element.data) {
            heroData.description = element.data.text || element.data.description || '';
        }

        // Extract from background-image element
        if (element.elementId === 'background-image') {
            if (element.data && element.data.imageUrl) {
                heroData.image = element.data.imageUrl;
            } else if (element.style && element.style.backgroundImage) {
                const urlMatch = element.style.backgroundImage.match(/url\(["']?([^"']+)["']?\)/);
                if (urlMatch && urlMatch[1]) {
                    heroData.image = urlMatch[1];
                }
            }
        }

        // Extract icon if found
        if (element.data && element.data.icon) {
            heroData.icon = element.data.icon;
        }

        // Recursively process children
        if (element.children && Array.isArray(element.children)) {
            element.children.forEach(extractFromElement);
        }
    };

    // Process all elements
    elementIds.forEach(extractFromElement);

    return heroData;
}

/**
 * Get default hero data from UserProject model
 * @param {String} projectId - MongoDB ObjectId of the project
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} Express response with hero data
 */
async function getDefaultHeroData(projectId, res) {
    try {
        const project = await UserProject.findById(projectId)
            .select('projectName image images description fas_fa_icon')
            .lean();

        if (!project) {
            console.log(`[getDefaultHeroData] Project not found for projectId: ${projectId}`);
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        // Get image from images array (first image) or fallback to single image field
        let heroImage = null;
        if (project.images && Array.isArray(project.images) && project.images.length > 0) {
            // Get the first image from the images array
            const firstImage = project.images[0];
            heroImage = firstImage.url || firstImage.imageUrl || firstImage.src || null;
            console.log(`[getDefaultHeroData] Found image from images array:`, heroImage);
        } else if (project.image) {
            // Fallback to single image field if images array is empty
            heroImage = project.image;
            console.log(`[getDefaultHeroData] Found image from single image field:`, heroImage);
        }

        const heroData = {
            projectName: project.projectName || 'Welcome to Our Service',
            image: heroImage,
            description: project.description || 'We provide exceptional service with dedication and expertise.',
            icon: project.fas_fa_icon || 'fas fa-star'
        };

        console.log(`[getDefaultHeroData] Final data being sent (from UserProject table):`, JSON.stringify(heroData, null, 2));
        console.log(`[getDefaultHeroData] Data summary for projectId: ${projectId}`, {
            projectName: heroData.projectName,
            hasImage: !!heroData.image,
            imageUrl: heroData.image,
            hasDescription: !!heroData.description,
            icon: heroData.icon,
            imagesArrayLength: project.images ? project.images.length : 0
        });

        return res.status(200).json({
            success: true,
            message: 'Hero component data retrieved successfully',
            data: heroData,
            dataSource: 'UserProject'
        });
    } catch (error) {
        console.error('[getDefaultHeroData] Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching hero data from database',
            error: error.message
        });
    }
}

/**
 * Extract services data from elementIds array
 * @param {Array} elementIds - Array of element objects from WebsiteDesignsData
 * @returns {Array} Array of service objects
 */
function extractServicesDataFromElements(elementIds) {
    const services = [];

    // Recursive function to extract data from elements
    const extractFromElement = (element) => {
        if (!element) return;

        // Look for service containers (elements that might contain service data)
        // Services are typically in containers with service-related data
        if (element.data) {
            const serviceData = {
                service_name: '',
                service_description: '',
                fas_fa_icon: 'fas fa-circle',
                images: []
            };

            // Extract service name
            if (element.data.service_name || element.data.title || element.data.text) {
                serviceData.service_name = element.data.service_name || element.data.title || element.data.text || '';
            }

            // Extract service description
            if (element.data.service_description || element.data.description) {
                serviceData.service_description = element.data.service_description || element.data.description || '';
            }

            // Extract icon
            if (element.data.fas_fa_icon || element.data.icon || element.data.iconClass) {
                serviceData.fas_fa_icon = element.data.fas_fa_icon || element.data.icon || element.data.iconClass || 'fas fa-circle';
            }

            // Extract images
            if (element.data.images && Array.isArray(element.data.images)) {
                serviceData.images = element.data.images.map(img => ({
                    url: img.url || img.imageUrl || '',
                    description: img.description || img.alt || ''
                })).filter(img => img.url); // Filter out empty URLs
            } else if (element.data.imageUrl || element.data.image) {
                // Single image
                serviceData.images = [{
                    url: element.data.imageUrl || element.data.image || '',
                    description: element.data.imageAlt || element.data.imageDescription || ''
                }].filter(img => img.url);
            }

            // If we found at least service_name, add it to services array
            if (serviceData.service_name) {
                services.push(serviceData);
            }
        }

        // Recursively process children
        if (element.children && Array.isArray(element.children)) {
            element.children.forEach(extractFromElement);
        }
    };

    // Process all elements
    elementIds.forEach(extractFromElement);

    return services;
}

/**
 * Get default services data from Service model
 * @param {String} projectId - MongoDB ObjectId of the project
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} Express response with services data
 */
async function getDefaultServicesData(projectId, res) {
    try {
        // Get all services for the project (minimal schema)
        const services = await Service.find({ 
            projectId: projectId
        }).lean();

        console.log(`[getDefaultServicesData] Found ${services ? services.length : 0} services for projectId: ${projectId}`);

        if (!services || services.length === 0) {
            console.log(`[getDefaultServicesData] No services found in database for projectId: ${projectId}`);
            return res.status(200).json({
                success: true,
                message: 'Services component data retrieved successfully',
                data: []
            });
        }

        // Format services data - ensure we only include services with actual data
        const formattedServices = services
            .filter(service => service.name && String(service.name).trim() !== '')
            .map(service => ({
                service_name: service.name || '',
                slug: service.slug || ''
            }));

        console.log(`[getDefaultServicesData] Final data being sent (from Service table):`, JSON.stringify(formattedServices, null, 2));
        console.log(`[getDefaultServicesData] Data summary: ${formattedServices.length} services from database for projectId: ${projectId}`);

        return res.status(200).json({
            success: true,
            message: 'Services component data retrieved successfully',
            data: formattedServices,
            dataSource: 'Service'
        });
    } catch (error) {
        console.error('[getDefaultServicesData] Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching services data from database',
            error: error.message
        });
    }
}

/**
 * Extract CTA data from elementIds array
 * @param {Array} elementIds - Array of element objects from WebsiteDesignsData
 * @returns {Array} Array of CTA objects with title and description
 */
function extractCTADataFromElements(elementIds) {
    const ctas = [];

    // Recursive function to extract data from elements
    const extractFromElement = (element) => {
        if (!element) return;

        // Look for CTA containers (elements that might contain CTA data)
        if (element.data) {
            const ctaData = {
                title: '',
                description: ''
            };

            // Extract CTA title
            if (element.data.title || element.data.heading || element.data.text) {
                ctaData.title = element.data.title || element.data.heading || element.data.text || '';
            }

            // Extract CTA description
            if (element.data.description || element.data.text) {
                ctaData.description = element.data.description || element.data.text || '';
            }

            // If we found at least title, add it to CTAs array
            if (ctaData.title && ctaData.title.trim() !== '') {
                ctas.push(ctaData);
            }
        }

        // Recursively process children
        if (element.children && Array.isArray(element.children)) {
            element.children.forEach(extractFromElement);
        }
    };

    // Process all elements
    elementIds.forEach(extractFromElement);

    return ctas;
}

/**
 * Get default CTA data from UserProject model
 * @param {String} projectId - MongoDB ObjectId of the project
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} Express response with CTA data
 */
async function getDefaultCTAData(projectId, res) {
    try {
        const project = await UserProject.findById(projectId)
            .select('cta')
            .lean();

        if (!project) {
            console.log(`[getDefaultCTAData] Project not found for projectId: ${projectId}`);
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        // Format CTA data from project.cta array
        const formattedCTAs = (project.cta || [])
            .filter(cta => cta && (cta.title || cta.description))
            .map(cta => ({
                title: cta.title || '',
                description: cta.description || ''
            }))
            .filter(cta => cta.title && cta.title.trim() !== ''); // Only include CTAs with titles

        console.log(`[getDefaultCTAData] Final data being sent (from UserProject table):`, JSON.stringify(formattedCTAs, null, 2));
        console.log(`[getDefaultCTAData] Data summary: ${formattedCTAs.length} CTAs from database for projectId: ${projectId}`);

        return res.status(200).json({
            success: true,
            message: 'CTA component data retrieved successfully',
            data: formattedCTAs,
            dataSource: 'UserProject'
        });
    } catch (error) {
        console.error('[getDefaultCTAData] Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching CTA data from database',
            error: error.message
        });
    }
}

module.exports = {
    extractHeroDataFromElements,
    getDefaultHeroData,
    extractServicesDataFromElements,
    getDefaultServicesData,
    extractCTADataFromElements,
    getDefaultCTAData
};
