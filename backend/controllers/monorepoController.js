// backend/controllers/monorepoController.js

exports.getHeroSection = async (req, res) => {
  try {
    // In future: fetch from DB, for now static demo
    // Note: Component now uses fixed styles, so we only return content (title, description, backgroundImage)
    // Styles are handled by the component itself and not overridden by API
    // Component will use:
    // - Section: padding "72px 40px", minHeight 420
    // - Overlay: rgba(255,255,255,0.9), padding 28, borderRadius "8px", margin "0 auto", maxWidth 600
    // - Title: fontSize "2.5rem", fontWeight 800, color "#0f172a"
    // - Description: fontSize "1.125rem", color "#334155"
    res.json({
      backgroundImage: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
      title: "Best smm panel in the world!",
      description: "Fully flexible smm panel, modular smm services, and ready for anything marketing and social growth. Drag, drop, customize!"
    });
  } catch (e) {
    res.status(500).json({ error: "Hero fetch failed" });
  }
};

// Element content APIs
exports.getElementContent = async (req, res) => {
  try {
    const { elementType, elementId, projectId } = req.body;

    if (!elementType) {
      return res.status(400).json({ message: 'Element type is required' });
    }

    // Default content based on element type
    let defaultContent = {};
    
    switch (elementType) {
      case 'heading':
        defaultContent = {
          heading: 'Dynamic Heading',
          title: 'Dynamic Heading',
          text: 'Dynamic Heading'
        };
        break;
      case 'text':
        defaultContent = {
          text: 'Dynamic text content',
          content: 'Dynamic text content',
          description: 'Dynamic text content'
        };
        break;
      case 'description':
        defaultContent = {
          description: 'Dynamic description content',
          descriptionHtml: '<p>Dynamic description content</p>',
          content: 'Dynamic description content',
          html: '<p>Dynamic description content</p>'
        };
        break;
      case 'button':
        defaultContent = {
          buttonText: 'Click Me',
          text: 'Click Me',
          label: 'Click Me',
          title: 'Click Me'
        };
        break;
      default:
        defaultContent = {
          content: 'Dynamic content'
        };
    }

    // TODO: Fetch from database if elementId and projectId are provided
    // if (elementId && projectId) {
    //   const element = await ElementContent.findOne({ elementId, projectId });
    //   if (element) {
    //     return res.json(element.content);
    //   }
    // }

    return res.json(defaultContent);
  } catch (error) {
    console.error('Error fetching element content:', error);
    return res.status(500).json({ message: 'Error fetching element content' });
  }
};

// Get heading content
exports.getHeadingContent = async (req, res) => {
  try {
    const { projectId, sectionId } = req.query;

    const headingData = {
      heading: 'Dynamic Heading from API',
      title: 'Dynamic Heading from API',
      text: 'Dynamic Heading from API'
    };

    // TODO: Fetch from database
    // if (projectId && sectionId) {
    //   const content = await ElementContent.findOne({ projectId, sectionId, type: 'heading' });
    //   if (content) {
    //     return res.json(content.data);
    //   }
    // }

    return res.json(headingData);
  } catch (error) {
    console.error('Error fetching heading content:', error);
    return res.status(500).json({ message: 'Error fetching heading content' });
  }
};

// Get text content
exports.getTextContent = async (req, res) => {
  try {
    const { projectId, sectionId } = req.query;

    const textData = {
      text: 'Dynamic text content from API',
      content: 'Dynamic text content from API',
      description: 'Dynamic text content from API'
    };

    return res.json(textData);
  } catch (error) {
    console.error('Error fetching text content:', error);
    return res.status(500).json({ message: 'Error fetching text content' });
  }
};

// Get description content
exports.getDescriptionContent = async (req, res) => {
  try {
    const { projectId, sectionId } = req.query;

    const descriptionData = {
      description: 'Dynamic description content from API',
      descriptionHtml: '<p>Dynamic description content from API</p>',
      content: 'Dynamic description content from API',
      html: '<p>Dynamic description content from API</p>'
    };

    return res.json(descriptionData);
  } catch (error) {
    console.error('Error fetching description content:', error);
    return res.status(500).json({ message: 'Error fetching description content' });
  }
};

// Get button content
exports.getButtonContent = async (req, res) => {
  try {
    const { projectId, sectionId } = req.query;

    const buttonData = {
      buttonText: 'Dynamic Button Text',
      text: 'Dynamic Button Text',
      label: 'Dynamic Button Text',
      title: 'Dynamic Button Text'
    };

    return res.json(buttonData);
  } catch (error) {
    console.error('Error fetching button content:', error);
    return res.status(500).json({ message: 'Error fetching button content' });
  }
};

// Get features section content
exports.getFeaturesSection = async (req, res) => {
  try {
    // In future: fetch from DB, for now static demo
    // Note: Component uses fixed styles, so we only return content
    res.json({
      title: "Our Amazing Features",
      subtitle: "Discover what makes us special",
      features: [
        {
          title: "Fast & Reliable",
          description: "Lightning-fast performance with 99.9% uptime guarantee",
          icon: "⚡"
        },
        {
          title: "Easy to Use",
          description: "Intuitive interface that anyone can master in minutes",
          icon: "🎯"
        },
        {
          title: "Fully Customizable",
          description: "Tailor every detail to match your brand and vision",
          icon: "🎨"
        }
      ]
    });
  } catch (e) {
    res.status(500).json({ error: "Features fetch failed" });
  }
};

// Get all elements section content
exports.getAllElementsSection = async (req, res) => {
  try {
    // In future: fetch from DB, for now static demo
    res.json({
      title: "All Elements Showcase"
    });
  } catch (e) {
    res.status(500).json({ error: "All elements fetch failed" });
  }
};