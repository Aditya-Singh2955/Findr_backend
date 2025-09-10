const Job = require("../model/JobSchema");
const User = require("../model/UserSchemas");
const Application = require("../model/ApplicationSchema");

// Create a new job
exports.createJob = async (req, res) => {
  try {
    const employerId = req.user?.id;
    if (!employerId) {
      return res.status(401).json({ message: "Unauthorized. Please login as an employer." });
    }

    const jobData = {
      ...req.body,
      employer: employerId,
      status: "active" // Default status for new jobs
    };

    const newJob = new Job(jobData);
    await newJob.save();

    res.status(201).json({
      message: "Job created successfully",
      data: newJob
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      message: "Failed to create job", 
      error: error.message 
    });
  }
};

// Update a job
exports.updateJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const employerId = req.user?.id;

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    // Check if the user is the job owner
    if (job.employer.toString() !== employerId) {
      return res.status(403).json({ message: "Not authorized to update this job" });
    }

    const updatedJob = await Job.findByIdAndUpdate(
      jobId,
      { $set: req.body },
      { new: true }
    );

    res.status(200).json({
      message: "Job updated successfully",
      data: updatedJob
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      message: "Failed to update job", 
      error: error.message 
    });
  }
};

// Get all jobs (with filters)
exports.getJobs = async (req, res) => {
  try {
    const {
      location,
      jobType,
      experienceLevel,
      industry,
      status = "active",
      page = 1,
      limit = 10,
      search,
      myJobs, // New parameter to filter employer's own jobs
    } = req.query;

    const query = { status };

    // If myJobs=true and user is authenticated, filter by employer
    if (myJobs === 'true' && req.user?.id) {
      query.employer = req.user.id;
    }

    // Add filters if provided
    if (location) query.location = new RegExp(location, 'i');
    if (jobType) query.jobType = jobType;
    if (experienceLevel) query.experienceLevel = experienceLevel;
    if (industry) query.industry = new RegExp(industry, 'i');
    if (search) {
      query.$text = { $search: search };
    }

    const jobs = await Job.find(query)
      .populate('employer', 'companyName companyLocation companyDescription companyWebsite')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Job.countDocuments(query);

    res.status(200).json({
      message: "Jobs fetched successfully",
      data: {
        jobs,
        pagination: {
          total,
          pages: Math.ceil(total / limit),
          page: parseInt(page),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      message: "Failed to fetch jobs", 
      error: error.message 
    });
  }
};

// Get a single job
exports.getJob = async (req, res) => {
  try {
    const { jobId } = req.params;

    const job = await Job.findById(jobId)
      .populate('employer', 'companyName companyLocation companyDescription companyWebsite')
      .populate('applications');

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    // Check if the viewer is the job owner
    const viewerId = req.user?.id;
    const isOwner = viewerId && job.employer.toString() === viewerId;
    
    // If job is closed and viewer is not the owner, return 404
    if (job.status === 'closed' && !isOwner) {
      return res.status(404).json({ message: "Job not found" });
    }

    // Increment view count only if viewer is not the job owner and job is active
    // This ensures employers don't inflate their own job view counts
    console.log('Job View - ViewerId:', viewerId, 'Job Owner:', job.employer.toString(), 'Is Owner:', isOwner);
    
    if (!isOwner && job.status === 'active') {
      job.views = (job.views || 0) + 1;
      await job.save();
      console.log('View count incremented to:', job.views);
    } else {
      console.log('View count NOT incremented (owner viewing own job or job not active)');
    }

    // Add application count for easy access
    const jobData = job.toObject();
    jobData.applicationCount = job.applications ? job.applications.length : 0;

    res.status(200).json({
      message: "Job fetched successfully",
      data: jobData
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      message: "Failed to fetch job", 
      error: error.message 
    });
  }
};

// Close a job (replaces delete functionality)
exports.closeJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const employerId = req.user?.id;

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    // Check if the user is the job owner
    if (job.employer.toString() !== employerId) {
      return res.status(403).json({ message: "Not authorized to close this job" });
    }

    // Update job status to closed instead of deleting
    const updatedJob = await Job.findByIdAndUpdate(
      jobId,
      { status: "closed" },
      { new: true }
    );

    res.status(200).json({
      message: "Job closed successfully",
      data: updatedJob
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      message: "Failed to close job", 
      error: error.message 
    });
  }
};

// Get employer's own jobs
exports.getEmployerJobs = async (req, res) => {
  try {
    const employerId = req.user?.id;
    if (!employerId) {
      return res.status(401).json({ message: "Unauthorized. Please login as an employer." });
    }

    const {
      status,
      page = 1,
      limit = 10,
      search,
    } = req.query;

    const query = { employer: employerId };
    
    // Only filter by status if explicitly provided
    if (status) {
      query.status = status;
    }

    // Add search if provided
    if (search) {
      query.$text = { $search: search };
    }

    const jobs = await Job.find(query)
      .populate('employer', 'companyName companyLocation companyDescription companyWebsite')
      .populate('applications')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Job.countDocuments(query);

    res.status(200).json({
      message: "Employer jobs fetched successfully",
      data: {
        jobs,
        pagination: {
          total,
          pages: Math.ceil(total / limit),
          page: parseInt(page),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      message: "Failed to fetch employer jobs", 
      error: error.message 
    });
  }
};

// Publish a job
exports.publishJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const employerId = req.user?.id;

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    // Check if the user is the job owner
    if (job.employer.toString() !== employerId) {
      return res.status(403).json({ message: "Not authorized to publish this job" });
    }

    job.status = "active";
    await job.save();

    res.status(200).json({
      message: "Job published successfully",
      data: job
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      message: "Failed to publish job", 
      error: error.message 
    });
  }
};

// Get job recommendations for a user
exports.getJobRecommendations = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 5 } = req.query;

    // Get user profile
    const user = await User.findById(userId).select('skills location professionalExperience');
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get jobs user has already applied to
    const appliedJobIds = await Application.find({ applicantId: userId }).distinct('jobId');

    // Build query for active jobs (excluding applied ones)
    let matchQuery = {
      status: 'active',
      _id: { $nin: appliedJobIds }
    };

    // Get all active jobs
    const jobs = await Job.find(matchQuery)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit) * 2); // Get more jobs for better scoring

    if (jobs.length === 0) {
      // If no jobs excluding applied ones, try getting any active jobs
      const allActiveJobs = await Job.find({ status: 'active' })
        .sort({ createdAt: -1 })
        .limit(parseInt(limit));
      
      if (allActiveJobs.length === 0) {
        return res.json({
          message: "No job recommendations available",
          data: []
        });
      }

      // Use all active jobs as fallback
      const fallbackJobs = allActiveJobs.map(job => ({
        ...job.toObject(),
        recommendationScore: calculateSimpleRecommendationScore(job, user)
      }));

      return res.json({
        message: "Job recommendations retrieved successfully",
        data: fallbackJobs.sort((a, b) => b.recommendationScore - a.recommendationScore)
      });
    }

    // Calculate recommendation scores
    const scoredJobs = jobs.map(job => {
      const score = calculateSimpleRecommendationScore(job, user);
      return {
        ...job.toObject(),
        recommendationScore: score
      };
    });

    // Sort by score and limit results
    const recommendedJobs = scoredJobs
      .sort((a, b) => b.recommendationScore - a.recommendationScore)
      .slice(0, parseInt(limit));


    res.json({
      message: "Job recommendations retrieved successfully",
      data: recommendedJobs
    });

  } catch (error) {
    console.error("Get job recommendations error:", error);
    res.status(500).json({ 
      message: "Failed to get job recommendations", 
      error: error.message 
    });
  }
};

// Simple recommendation scoring function
function calculateSimpleRecommendationScore(job, user) {
  try {
    let score = 50; // Base score

    // Skills match (40% weight)
    if (job.skills && Array.isArray(job.skills) && user.skills && Array.isArray(user.skills)) {
      const jobSkills = job.skills.map(skill => String(skill).toLowerCase());
      const userSkills = user.skills.map(skill => String(skill).toLowerCase());
      
      const matchingSkills = jobSkills.filter(jobSkill => 
        userSkills.some(userSkill => 
          userSkill.includes(jobSkill) || jobSkill.includes(userSkill)
        )
      );
      
      if (jobSkills.length > 0) {
        const skillMatchPercent = (matchingSkills.length / jobSkills.length) * 40;
        score += skillMatchPercent;
      }
    }

    // Location match (30% weight)
    if (job.location && user.location) {
      const jobLoc = String(job.location).toLowerCase();
      const userLoc = String(user.location).toLowerCase();
      
      if (jobLoc.includes(userLoc) || userLoc.includes(jobLoc)) {
        score += 30;
      } else if (jobLoc.split(' ').some(word => userLoc.includes(word))) {
        score += 15; // Partial location match
      }
    }

    // Experience match (20% weight)
    if (job.experienceLevel && user.professionalExperience && Array.isArray(user.professionalExperience)) {
      const userExp = user.professionalExperience.length || 0;
      const jobExp = String(job.experienceLevel).toLowerCase();
      
      if ((jobExp.includes('entry') && userExp <= 2) ||
          (jobExp.includes('mid') && userExp >= 2 && userExp <= 7) ||
          (jobExp.includes('senior') && userExp >= 5)) {
        score += 20;
      } else {
        score += 10; // Partial match
      }
    }

    // Recent job bonus (10% weight)
    if (job.createdAt) {
      const daysSincePosted = (new Date() - new Date(job.createdAt)) / (1000 * 60 * 60 * 24);
      if (daysSincePosted <= 7) {
        score += 10;
      } else if (daysSincePosted <= 30) {
        score += 5;
      }
    }

    return Math.min(Math.round(score), 100);
  } catch (error) {
    console.error("Error calculating recommendation score:", error);
    return 50; // Return base score on error
  }
}
