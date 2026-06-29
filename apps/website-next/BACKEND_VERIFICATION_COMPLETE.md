# ✅ Backend Domain Deployment Fixes - VERIFIED & SAVED

## All Backend Changes Are Saved and Working

---

## 📁 File 1: `backend/controller/VpsController.js`

### ✅ **connectDomain Function - Lines 26-354**

#### **Check 1: Domain Already Connected to THIS Project (Lines 40-63)**
```javascript
// === Check 1: Domain already exists for THIS project? Skip connection ===
// Check both Domain model and ProjectDeployment table
const existingDomainForProject = await Domain.findOne({
  userId: new mongoose.Types.ObjectId(userId),
  projectId: new mongoose.Types.ObjectId(projectId),
  domain: apex
}).lean();

const existingDeploymentForProject = await ProjectDeployment.findOne({
  projectId: new mongoose.Types.ObjectId(projectId),
  domainName: apex
}).lean();

if (existingDomainForProject || existingDeploymentForProject) {
  // Domain already connected to this project - return success and skip connection
  const project = await userProjects.findById(projectId).select('domainName siteHostRootPath hostingId').lean();
  return res.status(200).json({
    ok: true,
    message: `Domain ${apex} already connected to this project`,
    domain: apex,
    skipped: true,
    project: project
  });
}
```

#### **Check 2: Domain in ANOTHER Project (Lines 65-107)**
```javascript
// === Check 2: Domain exists in ANOTHER project? Return options ===
// Check both Domain model and ProjectDeployment table
const existingDomainInOtherProject = await Domain.findOne({
  userId: new mongoose.Types.ObjectId(userId),
  domain: apex,
  projectId: { $ne: new mongoose.Types.ObjectId(projectId) }
}).populate('projectId', 'projectName').lean();

// Also check ProjectDeployment table for the domain
const existingDeploymentWithDomain = await ProjectDeployment.findOne({
  domainName: apex,
  projectId: { $ne: new mongoose.Types.ObjectId(projectId) }
}).populate('projectId', 'projectName').lean();

// Use Domain model result if available, otherwise use ProjectDeployment result
const conflictingProject = existingDomainInOtherProject || existingDeploymentWithDomain;

if (conflictingProject) {
  const existingProjectId = conflictingProject.projectId?._id || conflictingProject.projectId;
  const existingProjectName = conflictingProject.projectId?.projectName || 'Unknown Project';
  
  return res.status(409).json({
    ok: false,
    error: 'Domain already exists in another project',
    domain: apex,
    existingProject: {
      projectId: existingProjectId,
      projectName: existingProjectName
    },
    options: {
      unlink: {
        action: 'unlink',
        message: 'Unlink this domain from the other project and connect it here',
        api: '/admin/v1/unlinkDomain',
        requiredParams: { projectId: existingProjectId, domainName: apex }
      },
      useAnother: {
        action: 'useAnother',
        message: 'Use a different domain for this project'
      }
    }
  });
}
```

#### **Fixed Bug (Line 140)**
- **Before:** `{ $set: { domainName } }` ❌
- **After:** `{ $set: { domainName: apex } }` ✅
- Uses normalized `apex` instead of raw `domainName`

### ✅ **unlinkDomain Function - Lines 356-460**

**Complete function that:**
1. Validates input (projectId, domainName)
2. Normalizes domain to apex
3. Finds domain record
4. Removes from ProjectDeployment table
5. Removes from Domain model
6. Clears from UserProject model
7. Clears from any additional ProjectDeployment records
8. Returns detailed success response

```javascript
unlinkDomain: async (req, res) => {
  try {
    const { projectId, domainName } = req.body;
    const userId = req.user.userId;

    if (!projectId) {
      return res.status(400).json({ ok: false, error: "projectId is required" });
    }
    if (!domainName) {
      return res.status(400).json({ ok: false, error: "domainName is required" });
    }

    const apex = normalizeHost(domainName);
    if (!apex) {
      return res.status(400).json({ ok: false, error: "Invalid domainName" });
    }

    // Validate projectId
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ ok: false, error: "Invalid projectId format" });
    }

    const projectObjectId = new mongoose.Types.ObjectId(projectId);

    // Find the domain record
    const domain = await Domain.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      projectId: projectObjectId,
      domain: apex
    });

    if (!domain) {
      return res.status(404).json({ 
        ok: false, 
        error: `Domain ${apex} not found for this project`,
        message: "Domain may have already been unlinked"
      });
    }

    // 1) Remove from ProjectDeployment table
    const deploymentResult = await ProjectDeployment.updateMany(
      { 
        projectId: projectObjectId,
        domainName: apex 
      },
      { 
        $unset: { domainName: "" } 
      }
    );

    console.log(`[unlinkDomain] Removed domain from ${deploymentResult.modifiedCount} ProjectDeployment record(s)`);

    // 2) Remove from Domain model
    await Domain.deleteOne({
      _id: domain._id
    });

    console.log(`[unlinkDomain] Removed domain from Domain model`);

    // 3) Clear domainName from UserProject (set to null)
    const projectUpdateResult = await userProjects.updateMany(
      { 
        _id: projectObjectId,
        domainName: apex 
      },
      { 
        $unset: { domainName: "" } 
      }
    );

    console.log(`[unlinkDomain] Cleared domain from ${projectUpdateResult.modifiedCount} UserProject record(s)`);

    // 4) Also check and clear from any ProjectDeployment records that might have this domain
    const additionalDeployments = await ProjectDeployment.updateMany(
      { domainName: apex },
      { $unset: { domainName: "" } }
    );

    if (additionalDeployments.modifiedCount > 0) {
      console.log(`[unlinkDomain] Also cleared domain from ${additionalDeployments.modifiedCount} additional ProjectDeployment record(s)`);
    }

    return res.status(200).json({
      ok: true,
      message: `Domain ${apex} successfully unlinked from project`,
      unlinked: {
        domain: apex,
        projectId: projectId,
        fromTables: {
          Domain: true,
          ProjectDeployment: deploymentResult.modifiedCount + additionalDeployments.modifiedCount,
          UserProject: projectUpdateResult.modifiedCount
        }
      }
    });

  } catch (error) {
    console.error('[unlinkDomain] Error:', error);
    return res.status(500).json({
      ok: false,
      error: error.message || 'Failed to unlink domain',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
```

---

## 📁 File 2: `backend/routes/admin_v1.js`

### ✅ **Route Added - Line 203**

```javascript
router.post('/connectDomain', authentication, VpsController.connectDomain);
router.post('/unlinkDomain', authentication, VpsController.unlinkDomain);  // ✅ NEW
router.post('/getOurHostedDetails', AdminController.getOurHostedDetails);
```

---

## 🔍 Complete Verification

### ✅ All Required Models Imported:
- `userProjects` (line 7)
- `Domain` (line 8)
- `HostingConnection` (line 9)
- `ProjectDeployment` (line 10)
- `mongoose` (line 16)

### ✅ Module Exports:
- `connectDomain` - ✅ Updated with checks
- `unlinkDomain` - ✅ Added

### ✅ Routes:
- `/admin/v1/connectDomain` - ✅ Working
- `/admin/v1/unlinkDomain` - ✅ Added and registered

### ✅ Bug Fixes:
- Line 140: Changed `domainName` to `apex` for ProjectDeployment update ✅

---

## 📊 API Response Examples

### 1. Domain Already Connected (200 OK)
```json
{
  "ok": true,
  "message": "Domain example.com already connected to this project",
  "domain": "example.com",
  "skipped": true,
  "project": {
    "domainName": "example.com",
    "siteHostRootPath": "/var/www/ai/example.com",
    "hostingId": "..."
  }
}
```

### 2. Domain in Another Project (409 Conflict)
```json
{
  "ok": false,
  "error": "Domain already exists in another project",
  "domain": "example.com",
  "existingProject": {
    "projectId": "507f1f77bcf86cd799439011",
    "projectName": "Old Project Name"
  },
  "options": {
    "unlink": {
      "action": "unlink",
      "message": "Unlink this domain from the other project and connect it here",
      "api": "/admin/v1/unlinkDomain",
      "requiredParams": {
        "projectId": "507f1f77bcf86cd799439011",
        "domainName": "example.com"
      }
    },
    "useAnother": {
      "action": "useAnother",
      "message": "Use a different domain for this project"
    }
  }
}
```

### 3. Unlink Domain Success (200 OK)
```json
{
  "ok": true,
  "message": "Domain example.com successfully unlinked from project",
  "unlinked": {
    "domain": "example.com",
    "projectId": "507f1f77bcf86cd799439011",
    "fromTables": {
      "Domain": true,
      "ProjectDeployment": 2,
      "UserProject": 1
    }
  }
}
```

---

## ✅ **VERIFICATION COMPLETE - ALL CHANGES SAVED**

All backend code is properly saved and ready for deployment!

