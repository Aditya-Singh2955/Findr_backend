const mongoose = require("mongoose");

const findrUserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["jobseeker", "employer"],
      required: true,
    },
    name: {
      type: String,
      trim: true,
      required: true,
    },

    // Basic Profile
    profilePicture: {
      type: String, 
      default: "",
    },
    fullName: {
      type: String,
      trim: true,
      default: "",
    },
    phoneNumber: {
      type: String,
      trim: true,
      default: "",
    },
    location: {
      type: String,
      trim: true,
      default: "",
    },
    dateOfBirth: {
      type: Date,
      default: null,
    },
    nationality: {
      type: String,
      trim: true,
      default: "",
    },
    emirateId: {
      type: String,
      trim: true,
      default: "",
    },
    passportNumber: {
      type: String,
      trim: true,
      default: "",
    },
    employmentVisa: {
      type: String,
      trim: true,
      default: "",
    },
    introVideo: {
      type: String, // URL
      trim: true,
      default: "",
    },
    resumeDocument: {
      type: String, // URL
      trim: true,
      default: "",
    },
    professionalSummary: {
      type: String,
      trim: true,
      default: "",
    },
    refersLink: {
      type: String,
      trim: true,
      default: "",
    },
    referredMember: {
      type: String,
      trim: true,
      default: "",
    },

    // Professional Experience
    professionalExperience: {
      type: [{
        currentRole: { type: String, trim: true, default: "" },
        company: { type: String, trim: true, default: "" },
        yearsOfExperience: { type: Number, min: 0, default: 0 },
        industry: { type: String, trim: true, default: "" },
      }],
      default: [],
    },

    // Education
    education: {
      type: [{
        highestDegree: { type: String, trim: true, default: "" },
        institution: { type: String, trim: true, default: "" },
        yearOfGraduation: { type: Number, default: null },
        gradeCgpa: { type: String, trim: true, default: "" },
      }],
      default: [],
    },

    // Skills & Certification
    skills: {
      type: [String],
      default: [],
    },
    certifications: {
      type: [String],
      default: [],
    },

    // Job Preferences
    jobPreferences: {
      preferredJobType: {
        type: [String],
        enum: ["Full Time", "Part Time", "Contract", "Remote", "Hybrid"],
        default: [],
      },
      salaryExpectation: { type: String, trim: true, default: "" },
      preferredLocation: { type: String, trim: true, default: "" },
      availability: { type: String, trim: true, default: "" },
      resumeAndDocs: {
        type: [String], // store file URLs
        maxItems: 4, // CV + up to 3 docs
        default: [],
      },
    },

    // Social Media Links
    socialLinks: {
      linkedIn: { type: String, trim: true, default: "" },
      instagram: { type: String, trim: true, default: "" },
      twitterX: { type: String, trim: true, default: "" },
    },

    // RM Service
    rmService: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Inactive",
    },
    // Rewards
    rewards: {
      completeProfile: { type: Number, default: 0 },
      applyForJobs: { type: Number, default: 0 },
      referFriend: { type: Number, default: 0 },
      totalPoints: { type: Number, default: 0 },
    },
    referralRewardPoints: {
      type: Number,
      default: 0,
    },

    // Applications
    applications: {
      totalApplications: { type: Number, default: 0 },
      activeApplications: { type: Number, default: 0 },
      awaitingFeedback: { type: Number, default: 0 },
      appliedJobs: [
        {
          jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job" },
          role: String,
          company: String,
          date: { type: Date, default: Date.now },
        },
      ],
    },

    // Saved Jobs
    savedJobs: [
      {
        jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job" },
        role: String,
        company: String,
        dateSaved: { type: Date, default: Date.now },
      },
    ],
    profileCompleted: { type: String, default: "0" },
    points: { type: Number, default: 0 },
    membershipTier: { type: String, default: "Blue", enum: ["Blue", "Silver", "Gold", "Platinum"] },
  },
  { timestamps: true }
);

// Method to compare password
findrUserSchema.methods.comparePassword = function (candidatePassword) {
  return this.password === candidatePassword;
};

// Method to get public profile
findrUserSchema.methods.getPublicProfile = function () {
  const userObject = this.toObject();
  delete userObject.password;

  // Ensure name is always present
  if (!userObject.name && userObject.fullName) {
    userObject.name = userObject.fullName;
  } else if (!userObject.name && !userObject.fullName) {
    userObject.name = userObject.email.split('@')[0];
  }

  return userObject;
};

const FindrUser = mongoose.model("FindrUser", findrUserSchema);
module.exports = FindrUser;
