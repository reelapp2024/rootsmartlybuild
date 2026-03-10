const mongoose = require('mongoose');
const { Schema } = mongoose;

const siteHeaderFooterSchema = new Schema(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'userProjects',
      required: true,
      index: true
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    type: {
      type: Number,
      required: true,
      enum: [0, 1], // 0 = Header, 1 = Footer
      index: true
    },
    variant: {
      type: String,
      trim: true,
      default: 'a' // 'a', 'b', 'c', etc.
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'inactive',
      index: true
    },
    
    // Logo configuration
    logo: {
      url: {
        type: String,
        trim: true
      },
      alt: {
        type: String,
        trim: true,
        default: 'Logo'
      },
      width: {
        type: Number,
        default: 150
      },
      height: {
        type: Number,
        default: 50
      },
      style: {
        type: Schema.Types.Mixed,
        default: {}
      }
    },
    
    // Menu structure (supports infinite nesting)
    menu: [{
      id: {
        type: String,
        required: true,
        trim: true
      },
      name: {
        type: String,
        required: true,
        trim: true
      },
      url: {
        type: String,
        trim: true,
        default: '#'
      },
      // Link to a page - if set, URL will auto-update when page slug changes
      pageId: {
        type: Schema.Types.ObjectId,
        ref: 'WebsitePage',
        default: null
      },
      icon: {
        type: String,
        trim: true
      },
      target: {
        type: String,
        enum: ['_self', '_blank'],
        default: '_self'
      },
      order: {
        type: Number,
        default: 0
      },
      // Nested menu items (supports infinite nesting)
      children: {
        type: [Schema.Types.Mixed],
        default: []
      },
      // Menu item styles (for builder customization)
      style: {
        type: Schema.Types.Mixed,
        default: {}
      }
    }],
    
    // Contact details configuration
    contactDetails: {
      phone: {
        enabled: {
          type: Boolean,
          default: false
        },
        number: {
          type: String,
          trim: true
        },
        label: {
          type: String,
          trim: true,
          default: 'Phone'
        },
        style: {
          type: Schema.Types.Mixed,
          default: {}
        }
      },
      email: {
        enabled: {
          type: Boolean,
          default: false
        },
        address: {
          type: String,
          trim: true
        },
        label: {
          type: String,
          trim: true,
          default: 'Email'
        },
        style: {
          type: Schema.Types.Mixed,
          default: {}
        }
      },
      address: {
        enabled: {
          type: Boolean,
          default: false
        },
        text: {
          type: String,
          trim: true
        },
        style: {
          type: Schema.Types.Mixed,
          default: {}
        }
      }
    },
    
    // Header/Footer level styles (for builder customization)
    style: {
      type: Schema.Types.Mixed,
      default: {}
      // Supports all CSS properties:
      // backgroundColor, color, padding, margin, border, etc.
    },
    
    // Elements within header/footer (for builder editing)
    // This allows users to add/edit/remove elements like buttons, text, images, etc.
    elementIds: [{
      elementId: {
        type: String,
        required: true,
        trim: true
      },
      elementType: {
        type: String,
        required: true,
        trim: true
        // e.g., "heading", "text", "button", "image", "icon", "container"
      },
      // Element-level styles (for builder customization)
      style: {
        type: Schema.Types.Mixed,
        default: {}
      },
      // Element data (props/content)
      data: {
        type: Schema.Types.Mixed,
        default: {}
      },
      order: {
        type: Number,
        default: 0
      },
      // Children elements (recursive structure - supports infinite nesting)
      children: {
        type: [Schema.Types.Mixed],
        default: []
      }
    }],
    
    // Additional settings
    settings: {
      sticky: {
        type: Boolean,
        default: false // For header: sticky on scroll
      },
      transparent: {
        type: Boolean,
        default: false // Transparent on scroll (for header)
      },
      showOnMobile: {
        type: Boolean,
        default: true
      },
      showOnTablet: {
        type: Boolean,
        default: true
      },
      showOnDesktop: {
        type: Boolean,
        default: true
      },
      // Hamburger menu for mobile navigation
      mobileMenuEnabled: {
        type: Boolean,
        default: true // Enable hamburger menu icon for mobile devices
      },
      // Additional custom settings
      custom: {
        type: Schema.Types.Mixed,
        default: {}
      }
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes for performance
// Ensure only one active header/footer per project per type
siteHeaderFooterSchema.index({ projectId: 1, type: 1, status: 1 });
siteHeaderFooterSchema.index({ projectId: 1, type: 1 }); // For finding all headers/footers of a type
siteHeaderFooterSchema.index({ projectId: 1, status: 1 }); // For finding active items

// Virtual for getting full unique identifier
siteHeaderFooterSchema.virtual('uniqueId').get(function() {
  return `${this.type === 0 ? 'header' : 'footer'}_${this.variant}`;
});

module.exports = mongoose.model('siteHeaderFooter', siteHeaderFooterSchema);

