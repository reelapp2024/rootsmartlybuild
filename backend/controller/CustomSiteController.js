const mongoose = require('mongoose');
const WebsiteDesignsData = require('../models/WebsiteDesignsData');
const UserProject = require('../models/userProjects');

const CustomSiteController = {
    getHeroComponentData: async (req, res) => {
        try {
            const { projectId } = req.body;
            
            if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Valid projectId is required'
                });
            }

            const project = await UserProject.findById(projectId);
            if (!project) {
                return res.status(404).json({
                    success: false,
                    message: 'Project not found'
                });
            }

            return res.status(200).json({
                success: true,
                projectName: project.projectName || '',
                image: project.image || '',
                description: project.description || '',
                icon: project.icon || 'fas fa-star',
                fas_fa_icon: project.icon || 'fas fa-star'
            });
        } catch (error) {
            console.error('[getHeroComponentData] Error:', error);
            return res.status(500).json({
                success: false,
                message: 'Server error while retrieving hero component data',
                error: error.message
            });
        }
    },

    getServicesComponentData: async (req, res) => {
        try {
            const { projectId } = req.body;
            
            if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Valid projectId is required'
                });
            }

            const project = await UserProject.findById(projectId);
            if (!project) {
                return res.status(404).json({
                    success: false,
                    message: 'Project not found'
                });
            }

            const services = project.services || [];
            
            return res.status(200).json({
                success: true,
                services: services.map(service => ({
                    service_name: service.service_name || '',
                    service_description: service.service_description || '',
                    fas_fa_icon: service.fas_fa_icon || 'fas fa-check',
                    images: service.images || []
                }))
            });
        } catch (error) {
            console.error('[getServicesComponentData] Error:', error);
            return res.status(500).json({
                success: false,
                message: 'Server error while retrieving services component data',
                error: error.message
            });
        }
    },

    getCTAComponentData: async (req, res) => {
        try {
            const { projectId } = req.body;
            
            if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Valid projectId is required'
                });
            }

            const project = await UserProject.findById(projectId);
            if (!project) {
                return res.status(404).json({
                    success: false,
                    message: 'Project not found'
                });
            }

            const ctas = project.cta || [];
            
            return res.status(200).json({
                success: true,
                ctas: ctas.map(cta => ({
                    title: cta.title || '',
                    description: cta.description || ''
                }))
            });
        } catch (error) {
            console.error('[getCTAComponentData] Error:', error);
            return res.status(500).json({
                success: false,
                message: 'Server error while retrieving CTA component data',
                error: error.message
            });
        }
    },

    rewriteText: async (req, res) => {
        try {
            const { currentText, promptText, words, userId, projectId, pageId } = req.body;
            
            if (!currentText || !promptText) {
                return res.status(400).json({
                    success: false,
                    message: 'currentText and promptText are required'
                });
            }

            // Placeholder implementation - you may want to integrate with an AI service
            // For now, return the current text with a note
            return res.status(200).json({
                success: true,
                rewrittenText: currentText,
                message: 'Text rewrite functionality - to be implemented with AI service'
            });
        } catch (error) {
            console.error('[rewriteText] Error:', error);
            return res.status(500).json({
                success: false,
                message: 'Server error while rewriting text',
                error: error.message
            });
        }
    },

    component_layout: async (req, res) => {
        try {
            const { projectId, pageId, uniqueId } = req.body;

            if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Valid projectId is required'
                });
            }

            const designData = await WebsiteDesignsData.findOne({ projectId })
                .select('pages')
                .lean();

            if (!designData || !designData.pages || designData.pages.length === 0) {
                return res.status(200).json({
                    success: true,
                    message: 'No design data found for this project',
                    data: {
                        components: [],
                        componentsCount: 0
                    }
                });
            }

            // Helper function to build element hierarchy recursively
            const buildElementHierarchy = (element) => {
                const result = {
                    elementId: element.elementId,
                    elementType: element.elementType,
                    order: element.order || 0,
                    style: element.style || {},
                    data: element.data || {},
                    hasChildren: false,
                    childrenCount: 0
                };

                if (element.children && Array.isArray(element.children) && element.children.length > 0) {
                    result.children = element.children.map(buildElementHierarchy);
                    result.hasChildren = true;
                    result.childrenCount = result.children.length;
                }

                return result;
            };

            // Convert pageId to ObjectId if provided
            let targetPageId = null;
            if (pageId) {
                if (mongoose.Types.ObjectId.isValid(pageId)) {
                    targetPageId = new mongoose.Types.ObjectId(pageId);
                } else {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid pageId format'
                    });
                }
            }

            // Find the target page
            let targetPage = null;
            if (targetPageId) {
                targetPage = designData.pages.find(p => 
                    p.pageId && (
                        (p.pageId._id && p.pageId._id.toString() === targetPageId.toString()) ||
                        (typeof p.pageId === 'object' && p.pageId.toString() === targetPageId.toString()) ||
                        (typeof p.pageId === 'string' && p.pageId === pageId)
                    )
                );
            } else {
                targetPage = designData.pages[0];
            }

            if (!targetPage) {
                return res.status(200).json({
                    success: true,
                    message: pageId ? `Page with ID "${pageId}" not found` : 'No pages found',
                    data: pageId ? null : {
                        components: [],
                        componentsCount: 0
                    }
                });
            }

            // If uniqueId is provided, return only that component's layout
            if (uniqueId) {
                const targetComponent = (targetPage.componentIds || []).find(comp => {
                    if (comp.uniqueId) {
                        const compUniqueId = typeof comp.uniqueId === 'string' ? comp.uniqueId : String(comp.uniqueId);
                        return compUniqueId.toLowerCase() === uniqueId.toLowerCase();
                    }
                    return false;
                });

                if (!targetComponent) {
                    return res.status(200).json({
                        success: true,
                        message: `Component with uniqueId "${uniqueId}" not found`,
                        data: {
                            uniqueId: uniqueId,
                            componentId: null,
                            style: {},
                            elements: [],
                            elementsCount: 0
                        }
                    });
                }

                const elements = (targetComponent.elementIds || []).map(buildElementHierarchy);

                return res.status(200).json({
                    success: true,
                    message: 'Component layout retrieved successfully',
                    data: {
                        uniqueId: targetComponent.uniqueId,
                        componentId: targetComponent.componentId ? (targetComponent.componentId._id ? targetComponent.componentId._id.toString() : targetComponent.componentId.toString()) : null,
                        style: targetComponent.style || {},
                        elements: elements,
                        elementsCount: elements.length
                    }
                });
            }

            // Return all components for the page
            const components = (targetPage.componentIds || []).map(component => {
                const componentData = {
                    uniqueId: component.uniqueId,
                    componentId: component.componentId ? (component.componentId._id ? component.componentId._id.toString() : component.componentId.toString()) : null,
                    style: component.style || {},
                    elementsCount: 0,
                    elements: []
                };

                if (component.elementIds && Array.isArray(component.elementIds) && component.elementIds.length > 0) {
                    componentData.elements = component.elementIds.map(buildElementHierarchy);
                    componentData.elementsCount = componentData.elements.length;
                }

                return componentData;
            });

            return res.status(200).json({
                success: true,
                message: 'Page layout retrieved successfully',
                data: {
                    pageId: targetPageId ? targetPageId.toString() : (targetPage.pageId?._id?.toString() || targetPage.pageId?.toString()),
                    components: components,
                    componentsCount: components.length
                }
            });
        } catch (error) {
            console.error('[component_layout] Error:', error);
            return res.status(500).json({
                success: false,
                message: 'Server error while retrieving component layout',
                error: error.message
            });
        }
    },

    getElementChildren: async (req, res) => {
        try {
            const { projectId, pageId, uniqueId, elementId } = req.body;

            if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Valid projectId is required'
                });
            }

            // Fetch design data for the project
            const designData = await WebsiteDesignsData.findOne({ projectId })
                .select('pages')
                .lean();

            if (!designData || !designData.pages || designData.pages.length === 0) {
                return res.status(200).json({
                    success: true,
                    message: 'No design data found for this project',
                    data: {
                        components: [],
                        componentsCount: 0
                    }
                });
            }

            // Helper function to build element hierarchy recursively
            const buildElementHierarchy = (element) => {
                const result = {
                    elementId: element.elementId,
                    elementType: element.elementType,
                    order: element.order || 0,
                    style: element.style || {},
                    data: element.data || {},
                    hasChildren: false,
                    childrenCount: 0
                };

                if (element.children && Array.isArray(element.children) && element.children.length > 0) {
                    result.children = element.children.map(buildElementHierarchy);
                    result.hasChildren = true;
                    result.childrenCount = result.children.length;
                }

                return result;
            };

            // Helper function to find element recursively in nested structure
            const findElementRecursive = (elements, targetId) => {
                for (const element of elements) {
                    if (element.elementId === targetId) {
                        return element;
                    }
                    if (element.children && Array.isArray(element.children)) {
                        const found = findElementRecursive(element.children, targetId);
                        if (found) return found;
                    }
                }
                return null;
            };

            // Convert pageId to ObjectId if provided
            let targetPageId = null;
            if (pageId) {
                if (mongoose.Types.ObjectId.isValid(pageId)) {
                    targetPageId = new mongoose.Types.ObjectId(pageId);
                } else {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid pageId format'
                    });
                }
            }

            // Find the target page
            let targetPage = null;
            if (targetPageId) {
                targetPage = designData.pages.find(p => 
                    p.pageId && (
                        (p.pageId._id && p.pageId._id.toString() === targetPageId.toString()) ||
                        (typeof p.pageId === 'object' && p.pageId.toString() === targetPageId.toString()) ||
                        (typeof p.pageId === 'string' && p.pageId === pageId)
                    )
                );
            } else {
                // If no pageId, use first page
                targetPage = designData.pages[0];
            }

            if (!targetPage) {
                // If no page found, return empty result instead of 404
                return res.status(200).json({
                    success: true,
                    message: pageId ? `Page with ID "${pageId}" not found` : 'No pages found',
                    data: pageId ? null : {
                        components: [],
                        componentsCount: 0
                    }
                });
            }

            // Scenario 1: Only pageId - return all components
            if (!uniqueId && !elementId) {
                const components = (targetPage.componentIds || []).map(component => {
                    const componentData = {
                        uniqueId: component.uniqueId,
                        componentId: component.componentId ? (component.componentId._id ? component.componentId._id.toString() : component.componentId.toString()) : null,
                        style: component.style || {},
                        elementsCount: 0,
                        elements: []
                    };

                    if (component.elementIds && Array.isArray(component.elementIds) && component.elementIds.length > 0) {
                        componentData.elements = component.elementIds.map(buildElementHierarchy);
                        componentData.elementsCount = componentData.elements.length;
                    }

                    return componentData;
                });

                return res.status(200).json({
                    success: true,
                    message: 'Page layout retrieved successfully',
                    data: {
                        pageId: targetPageId ? targetPageId.toString() : (targetPage.pageId?._id?.toString() || targetPage.pageId?.toString()),
                        components: components,
                        componentsCount: components.length
                    }
                });
            }

            // Scenario 2 & 3: Find component by uniqueId or componentId
            // Handle both cases: uniqueId as string (e.g., "cta_c") or as ObjectId (componentId)
            let targetComponent = null;
            
            // First, try to find by uniqueId (string) - case insensitive
            if (uniqueId) {
                targetComponent = (targetPage.componentIds || []).find(comp => {
                    if (comp.uniqueId) {
                        const compUniqueId = typeof comp.uniqueId === 'string' ? comp.uniqueId : String(comp.uniqueId);
                        return compUniqueId.toLowerCase() === uniqueId.toLowerCase();
                    }
                    return false;
                });
            }
            
            // If not found by uniqueId, try to find by componentId (ObjectId)
            if (!targetComponent && uniqueId && mongoose.Types.ObjectId.isValid(uniqueId)) {
                const componentIdObj = new mongoose.Types.ObjectId(uniqueId);
                targetComponent = (targetPage.componentIds || []).find(comp => {
                    if (comp.componentId) {
                        const compId = comp.componentId._id ? comp.componentId._id : comp.componentId;
                        return compId.toString() === componentIdObj.toString();
                    }
                    return false;
                });
            }
            
            // Debug logging if component not found
            if (!targetComponent && uniqueId) {
                console.log('[getElementChildren] Component not found. Searching for uniqueId:', uniqueId);
                console.log('[getElementChildren] Available components:', (targetPage.componentIds || []).map(c => ({
                    uniqueId: c.uniqueId,
                    componentId: c.componentId ? (c.componentId._id ? c.componentId._id.toString() : c.componentId.toString()) : null
                })));
            }

            if (!targetComponent) {
                // Component not found - return empty elements instead of 404
                // This allows the UI to show an empty state instead of an error
                const availableComponents = (targetPage.componentIds || []).map(c => c.uniqueId || 'N/A').join(', ');
                console.log(`[getElementChildren] Component "${uniqueId}" not found. Available: ${availableComponents}`);
                
                return res.status(200).json({
                    success: true,
                    message: `Component with uniqueId/componentId "${uniqueId}" not found in this page`,
                    data: {
                        uniqueId: uniqueId,
                        componentId: null,
                        style: {},
                        elements: [],
                        elementsCount: 0
                    }
                });
            }

            // Scenario 2: pageId + uniqueId - return component's elements
            if (!elementId) {
                const elements = (targetComponent.elementIds || []).map(buildElementHierarchy);

                return res.status(200).json({
                    success: true,
                    message: 'Component layout retrieved successfully',
                    data: {
                        uniqueId: targetComponent.uniqueId,
                        componentId: targetComponent.componentId ? targetComponent.componentId.toString() : null,
                        style: targetComponent.style || {},
                        elements: elements,
                        elementsCount: elements.length
                    }
                });
            }

            // Scenario 3: pageId + uniqueId + elementId - return element's children
            if (!targetComponent.elementIds || targetComponent.elementIds.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: `Component "${uniqueId}" has no elements`
                });
            }

            // Search for element recursively in all elementIds and their children
            let targetElement = null;
            for (const element of targetComponent.elementIds) {
                if (element.elementId === elementId) {
                    targetElement = element;
                    break;
                }
                // Search in children recursively
                if (element.children && Array.isArray(element.children)) {
                    targetElement = findElementRecursive(element.children, elementId);
                    if (targetElement) break;
                }
            }

            if (!targetElement) {
                // Element not found - return empty children instead of 404
                const availableElementIds = [];
                const collectElementIds = (elements, prefix = '') => {
                    elements.forEach((el, idx) => {
                        availableElementIds.push(prefix + el.elementId);
                        if (el.children && Array.isArray(el.children) && el.children.length > 0) {
                            collectElementIds(el.children, prefix + el.elementId + ' > ');
                        }
                    });
                };
                collectElementIds(targetComponent.elementIds || []);
                
                console.log(`[getElementChildren] Element "${elementId}" not found in component "${uniqueId}". Available: ${availableElementIds.join(', ') || 'none'}`);
                
                return res.status(200).json({
                    success: true,
                    message: `Element with ID "${elementId}" not found in component "${uniqueId}"`,
                    data: {
                        element: {
                            elementId: elementId,
                            elementType: 'unknown',
                            order: 0,
                            style: {},
                            data: {}
                        },
                        children: [],
                        childrenCount: 0
                    }
                });
            }

            // Build element hierarchy with children
            const elementData = buildElementHierarchy(targetElement);

            return res.status(200).json({
                success: true,
                message: 'Element children retrieved successfully',
                data: {
                    element: {
                        elementId: elementData.elementId,
                        elementType: elementData.elementType,
                        order: elementData.order,
                        style: elementData.style,
                        data: elementData.data
                    },
                    children: elementData.children || [],
                    childrenCount: elementData.childrenCount
                }
            });
        } catch (error) {
            console.error('[getElementChildren] Error:', error);
            return res.status(500).json({
                success: false,
                message: 'Server error while retrieving element children',
                error: error.message
            });
        }
    },

    reorderLayout: async (req, res) => {
        try {
            const { projectId, pageId, uniqueId, elementId, parentElementId, direction } = req.body;

            if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Valid projectId is required'
                });
            }

            if (!direction || !['up', 'down'].includes(direction)) {
                return res.status(400).json({
                    success: false,
                    message: 'Direction must be "up" or "down"'
                });
            }

            // Fetch design data
            const designData = await WebsiteDesignsData.findOne({ projectId });
            if (!designData || !designData.pages || designData.pages.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'No design data found for this project'
                });
            }

            // Convert pageId to ObjectId if provided
            let targetPageId = null;
            if (pageId) {
                if (mongoose.Types.ObjectId.isValid(pageId)) {
                    targetPageId = new mongoose.Types.ObjectId(pageId);
                } else {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid pageId format'
                    });
                }
            }

            // Find the target page
            let targetPage = null;
            if (targetPageId) {
                targetPage = designData.pages.find(p => 
                    p.pageId && (
                        (p.pageId._id && p.pageId._id.toString() === targetPageId.toString()) ||
                        (typeof p.pageId === 'object' && p.pageId.toString() === targetPageId.toString()) ||
                        (typeof p.pageId === 'string' && p.pageId === pageId)
                    )
                );
            } else {
                targetPage = designData.pages[0];
            }

            if (!targetPage) {
                return res.status(404).json({
                    success: false,
                    message: pageId ? `Page with ID "${pageId}" not found` : 'No pages found'
                });
            }

            // Helper function to find element recursively
            const findElementRecursive = (elements, targetId) => {
                for (let i = 0; i < elements.length; i++) {
                    if (elements[i].elementId === targetId) {
                        return { element: elements[i], index: i, parent: elements };
                    }
                    if (elements[i].children && Array.isArray(elements[i].children)) {
                        const found = findElementRecursive(elements[i].children, targetId);
                        if (found) return found;
                    }
                }
                return null;
            };

            // Helper function to reorder array and update all order values
            const reorderArray = (array, index, direction) => {
                if (direction === 'up' && index > 0) {
                    [array[index], array[index - 1]] = [array[index - 1], array[index]];
                    // Update all order values to ensure consistency
                    array.forEach((item, idx) => {
                        if (item.order !== undefined) {
                            item.order = idx;
                        }
                    });
                    return true;
                } else if (direction === 'down' && index < array.length - 1) {
                    [array[index], array[index + 1]] = [array[index + 1], array[index]];
                    // Update all order values to ensure consistency
                    array.forEach((item, idx) => {
                        if (item.order !== undefined) {
                            item.order = idx;
                        }
                    });
                    return true;
                }
                return false;
            };

            // Scenario 1: Reorder components (only pageId provided)
            if (!uniqueId && !elementId) {
                const components = targetPage.componentIds || [];
                // Find component by uniqueId if provided (for future use)
                // For now, we'll need elementId to identify which component
                return res.status(400).json({
                    success: false,
                    message: 'Component reordering requires uniqueId'
                });
            }

            // Scenario 2: Reorder elements within a component (pageId + uniqueId)
            if (uniqueId && !elementId) {
                // Find component by uniqueId
                let targetComponent = null;
                let componentIndex = -1;
                
                if (uniqueId) {
                    for (let i = 0; i < (targetPage.componentIds || []).length; i++) {
                        const comp = targetPage.componentIds[i];
                        if (comp.uniqueId) {
                            const compUniqueId = typeof comp.uniqueId === 'string' ? comp.uniqueId : String(comp.uniqueId);
                            if (compUniqueId.toLowerCase() === uniqueId.toLowerCase()) {
                                targetComponent = comp;
                                componentIndex = i;
                                break;
                            }
                        }
                    }
                }

                if (!targetComponent) {
                    return res.status(404).json({
                        success: false,
                        message: `Component with uniqueId "${uniqueId}" not found`
                    });
                }

                // Reorder components themselves (if we're at the page level)
                // This would require a different approach - for now, we focus on elements
                return res.status(400).json({
                    success: false,
                    message: 'Element reordering requires elementId'
                });
            }

            // Scenario 3: Reorder element or its children (pageId + uniqueId + elementId)
            if (uniqueId && elementId) {
                // Find component
                let targetComponent = null;
                for (const comp of (targetPage.componentIds || [])) {
                    if (comp.uniqueId) {
                        const compUniqueId = typeof comp.uniqueId === 'string' ? comp.uniqueId : String(comp.uniqueId);
                        if (compUniqueId.toLowerCase() === uniqueId.toLowerCase()) {
                            targetComponent = comp;
                            break;
                        }
                    }
                }

                if (!targetComponent) {
                    return res.status(404).json({
                        success: false,
                        message: `Component with uniqueId "${uniqueId}" not found`
                    });
                }

                // If parentElementId is provided, we're reordering a child element
                if (parentElementId) {
                    // Find parent element
                    const parentResult = findElementRecursive(targetComponent.elementIds || [], parentElementId);
                    if (!parentResult) {
                        return res.status(404).json({
                            success: false,
                            message: `Parent element with ID "${parentElementId}" not found`
                        });
                    }

                    const parentElement = parentResult.element;
                    if (!parentElement.children || !Array.isArray(parentElement.children)) {
                        return res.status(404).json({
                            success: false,
                            message: `Parent element "${parentElementId}" has no children`
                        });
                    }

                    // Find child element
                    const childIndex = parentElement.children.findIndex(el => el.elementId === elementId);
                    if (childIndex === -1) {
                        return res.status(404).json({
                            success: false,
                            message: `Element "${elementId}" not found in parent "${parentElementId}"`
                        });
                    }

                    // Reorder child
                    const reordered = reorderArray(parentElement.children, childIndex, direction);
                    if (!reordered) {
                        return res.status(400).json({
                            success: false,
                            message: `Cannot move element ${direction} - already at ${direction === 'up' ? 'top' : 'bottom'}`
                        });
                    }

                    // Mark as modified
                    parentElement.markModified('children');
                } else {
                    // Reorder top-level element
                    // First, try to find in top-level elementIds
                    let elementIndex = (targetComponent.elementIds || []).findIndex(el => el.elementId === elementId);
                    let targetArray = targetComponent.elementIds;
                    
                    // If not found in top-level, search recursively in children
                    if (elementIndex === -1) {
                        const recursiveResult = findElementRecursive(targetComponent.elementIds || [], elementId);
                        if (recursiveResult) {
                            // Found in a child's children array
                            elementIndex = recursiveResult.index;
                            targetArray = recursiveResult.parent;
                        }
                    }
                    
                    if (elementIndex === -1) {
                        // Log available elements for debugging
                        const availableElements = [];
                        const collectElementIds = (elements, prefix = '') => {
                            elements.forEach((el) => {
                                availableElements.push(prefix + el.elementId);
                                if (el.children && Array.isArray(el.children) && el.children.length > 0) {
                                    collectElementIds(el.children, prefix + el.elementId + ' > ');
                                }
                            });
                        };
                        collectElementIds(targetComponent.elementIds || []);
                        
                        console.log(`[reorderLayout] Element "${elementId}" not found in component "${uniqueId}"`);
                        console.log(`[reorderLayout] Available elements:`, availableElements);
                        
                        return res.status(404).json({
                            success: false,
                            message: `Element "${elementId}" not found in component "${uniqueId}". Available: ${availableElements.join(', ') || 'none'}`
                        });
                    }

                    // Reorder element
                    const reordered = reorderArray(targetArray, elementIndex, direction);
                    if (!reordered) {
                        return res.status(400).json({
                            success: false,
                            message: `Cannot move element ${direction} - already at ${direction === 'up' ? 'top' : 'bottom'}`
                        });
                    }

                    // Mark as modified
                    // Always mark the component's elementIds as modified to ensure nested changes are saved
                    targetComponent.markModified('elementIds');
                    
                    // Also try to mark the specific parent element if it's a nested element
                    // This helps Mongoose track the change, but if markModified doesn't exist, 
                    // marking elementIds above will still save the changes
                    if (targetArray !== targetComponent.elementIds) {
                        // Find the parent element that contains this array
                        const findParentOfArray = (elements, targetArray) => {
                            for (let i = 0; i < elements.length; i++) {
                                const el = elements[i];
                                if (el.children === targetArray) {
                                    return el;
                                }
                                if (el.children && Array.isArray(el.children)) {
                                    const found = findParentOfArray(el.children, targetArray);
                                    if (found) return found;
                                }
                            }
                            return null;
                        };
                        
                        const parentEl = findParentOfArray(targetComponent.elementIds || [], targetArray);
                        if (parentEl) {
                            // Try to mark as modified if it's a Mongoose subdocument
                            // If it's not, that's okay - marking elementIds above will handle it
                            try {
                                if (typeof parentEl.markModified === 'function') {
                                    parentEl.markModified('children');
                                }
                            } catch (err) {
                                // If markModified doesn't exist or fails, that's okay
                                // Marking elementIds will ensure the changes are saved
                                console.log('[reorderLayout] Could not mark nested element as modified, using elementIds instead');
                            }
                        }
                    }
                }

                // Mark entire document as modified
                designData.markModified('pages');
                
                // Save changes
                await designData.save();

                return res.status(200).json({
                    success: true,
                    message: `Element "${elementId}" moved ${direction} successfully`
                });
            }

            return res.status(400).json({
                success: false,
                message: 'Invalid parameters for reordering'
            });
        } catch (error) {
            console.error('[reorderLayout] Error:', error);
            return res.status(500).json({
                success: false,
                message: 'Server error while reordering layout',
                error: error.message
            });
        }
    }
};

module.exports = CustomSiteController;
