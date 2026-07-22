const mongoose = require('mongoose');
const Review = require('../models/reviews');
const User = require('../models/users');
const Blog = require('../models/blogs');
const Notification = require('../models/notification');
const helper = require("../additional/addon");

module.exports = {
    // Add Review
    add_review: async (req, res) => {
        try {
            const { blogId, fullName, email, rating, reviewText, image } = req.body;

            console.log(req.body, "data from add review api")

            if (!blogId || !mongoose.isValidObjectId(blogId)) {
                return res.status(400).json({ message: "Valid blogId is required" });
            }
            if (!fullName || !email || !rating) {
                return res.status(400).json({ message: "fullName, email and rating are required" });
            }

            // check blog exists
            const blogExists = await Blog.findById(blogId);
            if (!blogExists) {
                console.log("blog not found")
                return res.status(404).json({ message: "Blog not found" })
            }

            // find or create user with type=2 (reviewer)
            let user = await User.findOne({ email });
            if (!user) {
                user = new User({
                    fullName,
                    email,
                    type: 2,
                    image: image || null
                });
                await user.save();
            }

            const review = new Review({
                user: user._id,
                blog: blogId,
                rating,
                reviewText,
                image: image || user.image,
                verified: user.emailVerified,
                status: 0 // pending by default
            });

            await review.save();

            // Create notification for blog owner
            try {
                const blog = await Blog.findById(blogId).select('userId title').lean();
                if (blog && blog.userId) {
                    await Notification.create({
                        userFromId: user._id,
                        userToId: blog.userId,
                        message: `New review on your blog "${blog.title}" from ${fullName}`,
                        type: 'blog_review',
                        relatedId: blogId
                    });
                }
            } catch (notifError) {
                console.error('Error creating review notification:', notifError);
            }

            return helper.sendSuccess(res, 201, "Review added successfully (pending approval)", review);
        } catch (err) {
            console.error(err);
            return helper.sendError(res, 500, err);
        }
    },


    add_fake_reviews: async (req, res) => {
        try {
            const userId = req.user && req.user.userId;
            if (!userId) return res.status(401).json({ message: "Unauthorized: user missing" });

            const { blogId, count, exampleNames } = req.body;
            const fakeReviewsQueue = require("../queue/fakeReviewsQueue");
            const {
                startBatch,
                getDefaultParallelWorkers,
                getChunkSize,
            } = require("../services/fakeReviewsGenerationProgress");

            if (!blogId || !mongoose.isValidObjectId(blogId)) {
                return res.status(400).json({ message: "Valid blogId is required" });
            }
            const totalCount = Math.min(50, Math.max(1, parseInt(count, 10) || 0));
            if (!totalCount) {
                return res.status(400).json({ message: "count must be a positive number (1–50)" });
            }

            // --- Normalize exampleNames ---
            let namesArr = [];
            if (Array.isArray(exampleNames)) {
                namesArr = exampleNames.map((n) => String(n).trim()).filter(Boolean);
            } else if (typeof exampleNames === "string") {
                try {
                    const parsed = JSON.parse(exampleNames);
                    if (Array.isArray(parsed)) {
                        namesArr = parsed.map((n) => String(n).trim()).filter(Boolean);
                    } else {
                        namesArr = exampleNames.split(",").map((n) => n.trim()).filter(Boolean);
                    }
                } catch {
                    namesArr = exampleNames.split(",").map((n) => n.trim()).filter(Boolean);
                }
            }
            if (namesArr.length === 0) {
                namesArr = ["Rahul", "Rajat", "Priya", "Ankit", "Sneha"];
            }

            const blog = await Blog.findById(blogId).select("_id title projectId userId").lean();
            if (!blog) return res.status(404).json({ message: "Blog not found" });
            if (String(blog.userId) !== String(userId)) {
                return res.status(403).json({ message: "You do not own this blog" });
            }

            const projectId = blog.projectId ? String(blog.projectId) : "";
            const title = String(blog.title || "Blog").trim();
            const workers = getDefaultParallelWorkers();
            const chunkSize = getChunkSize();

            // Split into parallel Redis jobs (each job generates `chunkSize` reviews)
            const chunks = [];
            let remaining = totalCount;
            let chunkIndex = 0;
            while (remaining > 0) {
                const size = Math.min(chunkSize, remaining);
                chunks.push({ size, chunkIndex });
                remaining -= size;
                chunkIndex += 1;
            }

            console.log(
                `[add_fake_reviews] queueing ${totalCount} review(s) → ${chunks.length} job(s) · workers=${workers} · chunk=${chunkSize} blog=${blogId}`
            );

            const jobs = [];
            for (const ch of chunks) {
                const job = await fakeReviewsQueue.add({
                    userId: String(userId),
                    blogId: String(blogId),
                    projectId,
                    title,
                    exampleNames: namesArr,
                    chunkSize: ch.size,
                    chunkIndex: ch.chunkIndex,
                    version: 1,
                });
                jobs.push(job);
            }

            const jobIds = jobs.map((j) => String(j.id));
            const progress = startBatch(String(blogId), {
                userId: String(userId),
                projectId,
                blogTitle: title,
                total: totalCount,
                parallelWorkers: workers,
                jobIds,
                message: `Queued ${totalCount} review(s) · ${chunks.length} parallel job(s) · ${workers} workers`,
            });

            return res.status(202).json({
                message: "Fake review generation queued",
                success: true,
                count: totalCount,
                jobs: chunks.length,
                jobIds,
                parallelWorkers: workers,
                chunkSize,
                progress,
            });
        } catch (err) {
            console.error("[add_fake_reviews]", err);
            return helper.sendError(res, 500, err?.message || err);
        }
    },

    /**
     * POST /fake_reviews_generation_progress
     * Body: { blogId }
     */
    fake_reviews_generation_progress: async (req, res) => {
        try {
            const userId = req.user && req.user.userId;
            if (!userId) return res.status(401).json({ message: "Unauthorized: user missing" });

            const blogId = String(req.body?.blogId || "").trim();
            if (!blogId || !mongoose.isValidObjectId(blogId)) {
                return res.status(400).json({ message: "valid blogId is required" });
            }

            const blog = await Blog.findOne({ _id: blogId, userId })
                .select("_id")
                .lean();
            if (!blog) {
                return res.status(404).json({ message: "Blog not found" });
            }

            const fakeReviewsQueue = require("../queue/fakeReviewsQueue");
            const { reconcileWithQueue } = require("../services/fakeReviewsGenerationProgress");
            const data = await reconcileWithQueue(blogId, fakeReviewsQueue);

            return res.status(200).json({
                message: "OK",
                data: data
                    ? {
                          ...data,
                          recentEvents: Array.isArray(data.recentEvents)
                              ? data.recentEvents.slice(0, 10)
                              : [],
                      }
                    : null,
            });
        } catch (err) {
            console.error("[fake_reviews_generation_progress]", err);
            return helper.sendError(res, 500, err?.message || err);
        }
    },


    // Edit Review
    edit_review: async (req, res) => {
        try {
            const { reviewId } = req.body;
            const { rating, reviewText, image } = req.body;

            if (!mongoose.isValidObjectId(reviewId)) {
                return res.status(400).json({ message: "Valid reviewId required" });
            }

            const review = await Review.findById(reviewId);
            if (!review) return res.status(404).json({ message: "Review not found" });

            if (rating !== undefined) review.rating = rating;
            if (reviewText !== undefined) review.reviewText = reviewText;
            if (image !== undefined) review.image = image;

            // reset status back to pending if edited
            review.status = 0;

            await review.save();
            return helper.sendSuccess(res, 200, "Review updated (pending approval)", review);
        } catch (err) {
            console.error(err);
            return helper.sendError(res, 500, err);
        }
    },

    // Delete Review
    delete_review: async (req, res) => {
        try {
            const { reviewId } = req.body;

            if (!mongoose.isValidObjectId(reviewId)) {
                return res.status(400).json({ message: "Valid reviewId required" });
            }

            const deleted = await Review.findByIdAndDelete(reviewId);
            if (!deleted) return res.status(404).json({ message: "Review not found" });

            return helper.sendSuccess(res, 200, "Review deleted successfully", deleted);
        } catch (err) {
            console.error(err);
            return helper.sendError(res, 500, err);
        }
    },
    get_reviews: async (req, res) => {
        try {
            const { blogId, page = 1, limit = 10 } = req.body;

            if (!blogId || !mongoose.isValidObjectId(blogId)) {
                return res.status(400).json({ message: "Valid blogId is required" });
            }

            const parsedPage = parseInt(page);
            const parsedLimit = parseInt(limit);
            const skip = (parsedPage - 1) * parsedLimit;

            // Fetch reviews and total count in parallel
            const [reviews, totalReviews] = await Promise.all([
                Review.find({ blog: blogId, status: 1 })
                    .populate("user", "fullName email image type")
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(parsedLimit),
                Review.countDocuments({ blog: blogId, status: 1 })
            ]);

            // Build pagination info
            const paginationData = {
                total: totalReviews,
                page: parsedPage,
                limit: parsedLimit,
                pages: Math.ceil(totalReviews / parsedLimit)
            };

            // Send response exactly as you described
            return res.status(200).json({
                message: "Reviews fetched successfully",
                data: reviews,
                paginationData
            });

        } catch (err) {
            console.error(err);
            return helper.sendError(res, 500, err);
        }
    }
    ,



    // Approve/Reject Review
    approve_review: async (req, res) => {
        try {
            const { reviewId } = req.body;
            const { status } = req.body; // 1=approved, 2=rejected

            if (!mongoose.isValidObjectId(reviewId)) {
                return res.status(400).json({ message: "Valid reviewId required" });
            }
            if (![1, 2].includes(Number(status))) {
                return res.status(400).json({ message: "status must be 1 (approved) or 2 (rejected)" });
            }

            const review = await Review.findById(reviewId);
            if (!review) return res.status(404).json({ message: "Review not found" });

            review.status = Number(status);
            await review.save();

            return helper.sendSuccess(res, 200, "Review status updated", review);
        } catch (err) {
            console.error(err);
            return helper.sendError(res, 500, err);
        }
    },


    send_otp: async (req, res) => {
        try {
            const { email, fullName } = req.body; // allow optional fullName
            if (!email) {
                return helper.sendError(res, 400, "Email is required");
            }

            // Check if user exists, otherwise create one as Reviewer
            let user = await User.findOne({ email });
            if (!user) {
                user = new User({
                    fullName: fullName || email.split("@")[0], // fallback to name from email
                    email,
                    type: 2, // Reviewer
                    emailVerified: false
                });
                await user.save();
            }

            // Generate OTP
            let mail_otp;
            if (process.env.OTPFUNCTIONS === "false") {
                mail_otp = 1111;
            } else {
                mail_otp = Math.floor(1000 + Math.random() * 9000);
            }

            const otpExpiration = Date.now() + 5 * 60 * 1000; // 5 mins

            // Save OTP to user record
            user.mail_otp = mail_otp;
            user.otpExpiration = otpExpiration;
            await user.save();

            // Email content
            const emailContent = `
      <html>
        <body>
          <h2>Your OTP for verification</h2>
          <p>Please use the OTP below to verify your email:</p>
          <h1>${mail_otp}</h1>
          <p>This OTP will expire in 5 minutes.</p>
        </body>
      </html>
    `;

            await helper.sendEmail(email, "Your OTP Code", emailContent);

            return helper.sendSuccess(res, 200, "OTP sent successfully", { email });
        } catch (err) {
            console.error(err);
            return helper.sendError(res, 500, err);
        }
    },




    verify_otp: async (req, res) => {
        try {
            const { email, otp } = req.body;
            if (!email || !otp) {
                return helper.sendError(res, 400, "Email and OTP are required");
            }

            const user = await User.findOne({ email });
            if (!user) {
                return helper.sendError(res, 404, "User not found with this email");
            }

            console.log(user.mail_otp, otp)

            // Check OTP
            if (Number(user.mail_otp) !== Number(otp)) {
                return helper.sendError(res, 400, "Invalid OTP");
            }

            // Check expiration
            if (Date.now() > user.otpExpiration) {
                return helper.sendError(res, 400, "OTP has expired");
            }

            // Mark verified
            user.emailVerified = true;
            user.mail_otp = null; // clear OTP
            user.otpExpiration = null;
            await user.save();

            return helper.sendSuccess(res, 200, "Email verified successfully", { email });
        } catch (err) {
            console.error(err);
            return helper.sendError(res, 500, err);
        }
    },

    fetch_my_reviews: async (req, res) => {
        try {
            const userId = req.user && req.user.userId;
            if (!userId) {
                return helper.sendError(res, 401, "Unauthorized: user missing");
            }

            let { page = 1, limit = 10, status } = req.body;
            page = parseInt(page);
            limit = parseInt(limit);

            // Step 1: Find blogs owned by current user
            const blogs = await Blog.find({ userId: userId }).select("_id title type");
            if (!blogs.length) {
                return helper.sendSuccess(res, 200, "No blogs found for this user", {
                    reviews: [],
                    pagination: { total: 0, page, pages: 0, limit },
                });
            }

            const blogIds = blogs.map(b => b._id);

            // Step 2: Build query for reviews
            const query = { blog: { $in: blogIds } };
            if (status !== undefined && [0, 1, 2].includes(Number(status))) {
                query.status = Number(status); // apply filter only if valid
            }

            const total = await Review.countDocuments(query);

            const reviews = await Review.find(query)
                .populate({
                    path: "blog",
                    select: "title type", // attach blog info
                })
                .populate({
                    path: "user",
                    select: "fullName email image type", // reviewer info
                })
                .sort({ createdAt: -1 }) // latest on top
                .skip((page - 1) * limit)
                .limit(limit);

            return res.status(200).json({
                success: true, // ✅ add this
                message: "Reviews fetched successfully",
                data: {
                    reviews,
                    pagination: {
                        total,
                        page,
                        pages: Math.ceil(total / limit),
                        limit,
                    },
                },
            });

        } catch (err) {
            console.error(err);
            return helper.sendError(res, 500, err);
        }
    }


};
