const Employer = require("../model/EmployerSchema");
const Job = require("../model/JobSchema");
const Application = require("../model/ApplicationSchema");
const EmployerReview = require("../model/EmployerReviewSchema");

// Get employer profile details
exports.getEmployerProfileDetails = async (req, res) => {
  try {
    const employerId = req.user?.id;
    if (!employerId) {
      return res.status(401).json({ message: "Unauthorized. Please login first." });
    }

    const employer = await Employer.findById(employerId)
      .select('-password')
      .populate('postedJobs', 'title status createdAt applicationDeadline')
      .populate('applications', 'status appliedDate jobId applicantId')
      .populate('activeJobs', 'title status createdAt');
    
    if (!employer) {
      return res.status(404).json({ message: "Employer not found" });
    }

    const publicProfile = employer.getPublicProfile();

    res.status(200).json({
      success: true,
      data: {
        // Basic Information
        email: publicProfile.email,
        role: publicProfile.role,
        name: publicProfile.name,
        profilePhoto: publicProfile.profilePhoto || "",
        phoneNumber: publicProfile.phoneNumber || "",
        
        // Company Information
        companyName: publicProfile.companyName || "",
        companyEmail: publicProfile.companyEmail || "",
        companyLogo: publicProfile.companyLogo || "",
        industry: publicProfile.industry || "",
        teamSize: publicProfile.teamSize || "1-10",
        foundedYear: publicProfile.foundedYear || 0,
        aboutCompany: publicProfile.aboutCompany || "",
        
        // Location Information
        companyLocation: publicProfile.companyLocation || "",
        city: publicProfile.city || "",
        country: publicProfile.country || "",
        
        // Contact Information
        website: publicProfile.website || "",
        contactPerson: {
          name: publicProfile.contactPerson?.name || "",
          email: publicProfile.contactPerson?.email || "",
          phone: publicProfile.contactPerson?.phone || "",
        },
        
        // Social Links
        socialLinks: {
          linkedin: publicProfile.socialLinks?.linkedin || "",
          twitter: publicProfile.socialLinks?.twitter || "",
          facebook: publicProfile.socialLinks?.facebook || "",
        },
        
        // Job Management
        activeJobs: publicProfile.activeJobs || [],
        postedJobs: publicProfile.postedJobs || [],
        applications: publicProfile.applications || [],
        
        // Subscription & Status
        subscriptionPlan: publicProfile.subscriptionPlan || "free",
        subscriptionStatus: publicProfile.subscriptionStatus || "inactive",
        subscriptionExpiry: publicProfile.subscriptionExpiry || null,
        verificationStatus: publicProfile.verificationStatus || "pending",
        
        // Documents
        documents: {
          businessLicense: publicProfile.documents?.businessLicense || "",
          taxRegistration: publicProfile.documents?.taxRegistration || "",
          otherDocuments: publicProfile.documents?.otherDocuments || [],
        },
        
        // HR Services
        hrServices: publicProfile.hrServices || [],
        
        // Notifications Settings
        notifications: {
          email: {
            applications: publicProfile.notifications?.email?.applications ?? true,
            messages: publicProfile.notifications?.email?.messages ?? true,
            updates: publicProfile.notifications?.email?.updates ?? true,
          },
          inApp: {
            applications: publicProfile.notifications?.inApp?.applications ?? true,
            messages: publicProfile.notifications?.inApp?.messages ?? true,
            updates: publicProfile.notifications?.inApp?.updates ?? true,
          },
        },
        
        // Profile Stats
        points: publicProfile.points || 0,
        profileCompleted: publicProfile.profileCompleted || 0,
        
        // Timestamps
        createdAt: publicProfile.createdAt,
        updatedAt: publicProfile.updatedAt,
      }
    });
  } catch (error) {
    console.error("Get employer profile details error:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch employer profile details",
      error: error.message 
    });
  }
};

// Update employer profile
exports.updateEmployerProfile = async (req, res) => {
  try {
    const employerId = req.user?.id;
    if (!employerId) {
      return res.status(401).json({ message: "Unauthorized. Please login first." });
    }

    const updateData = req.body;
    
    // Remove sensitive fields that shouldn't be updated via this endpoint
    delete updateData.password;
    delete updateData.email;
    delete updateData.role;
    delete updateData.applications;
    delete updateData.postedJobs;
    delete updateData.activeJobs;

    const updatedEmployer = await Employer.findByIdAndUpdate(
      employerId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedEmployer) {
      return res.status(404).json({ message: "Employer not found" });
    }

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: updatedEmployer.getPublicProfile()
    });
  } catch (error) {
    console.error("Update employer profile error:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to update employer profile",
      error: error.message 
    });
  }
};

// Get public company profile by employer ID (no auth required)
exports.getPublicCompanyProfile = async (req, res) => {
  try {
    const { employerId } = req.params;
    
    if (!employerId) {
      return res.status(400).json({ 
        success: false,
        message: "Employer ID is required" 
      });
    }

    const employer = await Employer.findById(employerId)
      .select('-password -applications -postedJobs -activeJobs -subscriptionPlan -subscriptionStatus -subscriptionExpiry -documents -hrServices -notifications -points -profileCompleted')
      .populate('postedJobs', 'title status createdAt applicationDeadline views');
    
    if (!employer) {
      return res.status(404).json({ 
        success: false,
        message: "Company not found" 
      });
    }

    // Only return public information suitable for job seekers
    const publicCompanyData = {
      _id: employer._id,
      companyName: employer.companyName || "",
      industry: employer.industry || "",
      teamSize: employer.teamSize || "1-10",
      foundedYear: employer.foundedYear || 0,
      about: employer.aboutCompany || "",
      location: {
        city: employer.city || "",
        country: employer.country || "",
        officeAddress: employer.companyLocation || "",
      },
      website: employer.website || "",
      verified: employer.verificationStatus === "verified",
      logo: employer.companyLogo || "",
      socialLinks: {
        linkedin: employer.socialLinks?.linkedin || "",
        twitter: employer.socialLinks?.twitter || "",
        facebook: employer.socialLinks?.facebook || "",
      },
      // Add some computed fields for better UX
      activeJobsCount: employer.postedJobs ? employer.postedJobs.filter(job => job.status === 'active').length : 0,
      totalJobsPosted: employer.postedJobs ? employer.postedJobs.length : 0,
      memberSince: employer.createdAt,
    };

    res.status(200).json({
      success: true,
      data: publicCompanyData
    });
  } catch (error) {
    console.error("Get public company profile error:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch company profile",
      error: error.message 
    });
  }
};

// Get employer dashboard statistics
exports.getEmployerDashboardStats = async (req, res) => {
  try {
    const employerId = req.user?.id;
    if (!employerId) {
      return res.status(401).json({ message: "Unauthorized. Please login first." });
    }

    // Get job statistics
    const totalJobs = await Job.countDocuments({ employer: employerId });
    const activeJobs = await Job.countDocuments({ employer: employerId, status: "active" });
    const draftJobs = await Job.countDocuments({ employer: employerId, status: "draft" });
    const pausedJobs = await Job.countDocuments({ employer: employerId, status: "paused" });
    const closedJobs = await Job.countDocuments({ employer: employerId, status: "closed" });

    // Get application statistics
    const totalApplications = await Application.countDocuments({ employerId });
    const pendingApplications = await Application.countDocuments({ employerId, status: "pending" });
    const shortlistedApplications = await Application.countDocuments({ employerId, status: "shortlisted" });
    const interviewScheduled = await Application.countDocuments({ employerId, status: "interview_scheduled" });
    const hiredCount = await Application.countDocuments({ employerId, status: "hired" });
    const rejectedApplications = await Application.countDocuments({ employerId, status: "rejected" });

    // Get recent applications (last 10)
    const recentApplications = await Application.find({ employerId })
      .populate('jobId', 'title companyName')
      .populate('applicantId', 'name email profilePicture membershipTier')
      .sort({ appliedDate: -1 })
      .limit(10);

    // Get top performing jobs (by application count)
    const topJobs = await Job.aggregate([
      { $match: { employer: employerId } },
      {
        $lookup: {
          from: "applications",
          localField: "_id",
          foreignField: "jobId",
          as: "applications"
        }
      },
      {
        $project: {
          title: 1,
          status: 1,
          createdAt: 1,
          applicationCount: { $size: "$applications" }
        }
      },
      { $sort: { applicationCount: -1 } },
      { $limit: 5 }
    ]);

    res.status(200).json({
      success: true,
      data: {
        jobStats: {
          total: totalJobs,
          active: activeJobs,
          draft: draftJobs,
          paused: pausedJobs,
          closed: closedJobs
        },
        applicationStats: {
          total: totalApplications,
          pending: pendingApplications,
          shortlisted: shortlistedApplications,
          interviewScheduled: interviewScheduled,
          hired: hiredCount,
          rejected: rejectedApplications
        },
        recentApplications,
        topPerformingJobs: topJobs
      }
    });
  } catch (error) {
    console.error("Get employer dashboard stats error:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch dashboard statistics",
      error: error.message 
    });
  }
};

// Update employer subscription
exports.updateSubscription = async (req, res) => {
  try {
    const employerId = req.user?.id;
    const { subscriptionPlan, subscriptionStatus, subscriptionExpiry } = req.body;

    if (!employerId) {
      return res.status(401).json({ message: "Unauthorized. Please login first." });
    }

    const updatedEmployer = await Employer.findByIdAndUpdate(
      employerId,
      {
        subscriptionPlan,
        subscriptionStatus,
        subscriptionExpiry: subscriptionExpiry ? new Date(subscriptionExpiry) : undefined
      },
      { new: true }
    ).select('-password');

    if (!updatedEmployer) {
      return res.status(404).json({ message: "Employer not found" });
    }

    res.status(200).json({
      success: true,
      message: "Subscription updated successfully",
      data: {
        subscriptionPlan: updatedEmployer.subscriptionPlan,
        subscriptionStatus: updatedEmployer.subscriptionStatus,
        subscriptionExpiry: updatedEmployer.subscriptionExpiry
      }
    });
  } catch (error) {
    console.error("Update subscription error:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to update subscription",
      error: error.message 
    });
  }
};

// Update HR services
exports.updateHRServices = async (req, res) => {
  try {
    const employerId = req.user?.id;
    const { hrServices } = req.body;

    if (!employerId) {
      return res.status(401).json({ message: "Unauthorized. Please login first." });
    }

    const updatedEmployer = await Employer.findByIdAndUpdate(
      employerId,
      { hrServices },
      { new: true }
    ).select('-password');

    if (!updatedEmployer) {
      return res.status(404).json({ message: "Employer not found" });
    }

    res.status(200).json({
      success: true,
      message: "HR services updated successfully",
      data: updatedEmployer.hrServices
    });
  } catch (error) {
    console.error("Update HR services error:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to update HR services",
      error: error.message 
    });
  }
};

// Update notification preferences
exports.updateNotificationPreferences = async (req, res) => {
  try {
    const employerId = req.user?.id;
    const { notifications } = req.body;

    if (!employerId) {
      return res.status(401).json({ message: "Unauthorized. Please login first." });
    }

    const updatedEmployer = await Employer.findByIdAndUpdate(
      employerId,
      { notifications },
      { new: true }
    ).select('-password');

    if (!updatedEmployer) {
      return res.status(404).json({ message: "Employer not found" });
    }

    res.status(200).json({
      success: true,
      message: "Notification preferences updated successfully",
      data: updatedEmployer.notifications
    });
  } catch (error) {
    console.error("Update notification preferences error:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to update notification preferences",
      error: error.message 
    });
  }
};

// Create or update employer review
exports.createOrUpdateEmployerReview = async (req, res) => {
  try {
    const employerId = req.user?.id;
    if (!employerId) {
      return res.status(401).json({ message: "Unauthorized. Please login first." });
    }

    const { applicationId, applicantId, rating, comments, status, interviewNotes } = req.body;

    // Validation
    if (!applicationId || !applicantId || !rating) {
      return res.status(400).json({
        success: false,
        message: "Application ID, Applicant ID, and Rating are required"
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5"
      });
    }

    // Verify the application belongs to this employer
    const application = await Application.findById(applicationId).populate('jobId', 'employer');
    
    if (!application || application.jobId.employer.toString() !== employerId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to review this application"
      });
    }

    // Create or update review (upsert)
    const review = await EmployerReview.findOneAndUpdate(
      { employerId, applicationId },
      {
        employerId,
        applicationId,
        applicantId,
        rating,
        comments: comments || "",
        status: status || "pending",
        interviewNotes: interviewNotes || ""
      },
      { 
        new: true, 
        upsert: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      message: "Review saved successfully",
      data: review
    });

  } catch (error) {
    console.error("Error saving employer review:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Get employer review for specific application
exports.getEmployerReviewByApplication = async (req, res) => {
  try {
    const employerId = req.user?.id;
    if (!employerId) {
      return res.status(401).json({ message: "Unauthorized. Please login first." });
    }

    const { applicationId } = req.params;

    // Verify the application belongs to this employer
    const application = await Application.findById(applicationId).populate('jobId', 'employer');
    
    if (!application || application.jobId.employer.toString() !== employerId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to access this application"
      });
    }

    const review = await EmployerReview.findOne({
      employerId,
      applicationId
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found"
      });
    }

    res.status(200).json({
      success: true,
      data: review
    });

  } catch (error) {
    console.error("Error fetching employer review:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Get all employer reviews
exports.getAllEmployerReviews = async (req, res) => {
  try {
    const employerId = req.user?.id;
    if (!employerId) {
      return res.status(401).json({ message: "Unauthorized. Please login first." });
    }

    const { page = 1, limit = 10, status } = req.query;

    const query = { employerId };
    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      EmployerReview.find(query)
        .populate('applicantId', 'name email profilePicture')
        .populate({
          path: 'applicationId',
          populate: {
            path: 'jobId',
            select: 'title companyName'
          }
        })
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      EmployerReview.countDocuments(query)
    ]);

    // Format the response
    const formattedReviews = reviews.map(review => ({
      _id: review._id,
      employerId: review.employerId,
      applicationId: review.applicationId._id,
      applicantId: review.applicantId._id,
      applicantDetails: {
        name: review.applicantId.name,
        email: review.applicantId.email,
        profilePicture: review.applicantId.profilePicture
      },
      jobDetails: {
        title: review.applicationId.jobId.title,
        companyName: review.applicationId.jobId.companyName
      },
      rating: review.rating,
      comments: review.comments,
      status: review.status,
      interviewNotes: review.interviewNotes,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt
    }));

    res.status(200).json({
      success: true,
      data: {
        reviews: formattedReviews,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error("Error fetching employer reviews:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Delete employer review
exports.deleteEmployerReview = async (req, res) => {
  try {
    const employerId = req.user?.id;
    if (!employerId) {
      return res.status(401).json({ message: "Unauthorized. Please login first." });
    }

    const { reviewId } = req.params;

    const review = await EmployerReview.findOneAndDelete({
      _id: reviewId,
      employerId
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found or unauthorized"
      });
    }

    res.status(200).json({
      success: true,
      message: "Review deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting employer review:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

module.exports = exports;
