const mongoose = require("mongoose");

const employerSchema = new mongoose.Schema(
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
      default: "employer",
      enum: ["employer"],
    },
    name: {
      type: String,
      trim: true,
      required: true,
    },
    profilePhoto: {
      type: String,
      default: "",
    },
    companyName: {
      type: String,
      trim: true,
      default: "",
    },
    companyEmail: {
      type: String,
      trim: true,
      default: "",
    },
    companyLogo: {
      type: String,
      default: "",
    },
    points: {
      type: Number,
      default: 0,
    },
    profileCompleted: {
      type: Number,
      default: 0,
    },
    phoneNumber:{
      type: String,
      default: "",
    },
    website:{
      type: String,
      default: "",
    },
    industry: {
      type: String,
      trim: true,
      default: "",
    },
    teamSize: {
      type: String,
      enum: ["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"],
      default: "1-10",
    },
    foundedYear: {
      type: Number,
      default: 0,
    },
    aboutCompany: {
      type: String,
      trim: true,
      default: "",
    },
    contactPerson: {
      name: {
        type: String,
        trim: true,
        default: "",
      },
      email: {
        type: String,
        trim: true,
        default: "",
      },
      phone: {
        type: String,
        trim: true,
        default: "",
      },
    },
    companyLocation: {
      type: String,
      trim: true,
      default: "",
    },
    city:{
      type: String,
      trim: true,
      default: "",
    },
    country: {
      type: String,
      trim: true,
      default: "",
    },
    website: {
      type: String,
      trim: true,
      default: "",
    },
    socialLinks: {
      linkedin: String,
      twitter: String,
      facebook: String,
    },
    activeJobs: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job"
    }],
    applications: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application"
    }],
    postedJobs: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job"
    }],
    subscriptionPlan: {
      type: String,
      enum: ["free", "basic", "premium", "enterprise"],
      default: "free"
    },
    subscriptionStatus: {
      type: String,
      enum: ["active", "inactive", "expired"],
      default: "inactive"
    },
    subscriptionExpiry: {
      type: Date
    },
    verificationStatus: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending"
    },
    documents: {
      businessLicense: String,
      taxRegistration: String,
      otherDocuments: [String]
    },
    hrServices: {
      type: [{
        serviceName: {
          type: String,
          enum: [
            "recruitment",
            "payroll",
            "training",
            "compliance",
            "performance",
            "analytics"
          ]
        },
        status: {
          type: String,
          enum: ["active", "inactive", "pending"],
          default: "inactive"
        },
        startDate: Date,
        endDate: Date
      }],
      default: []
    },
    membershipTier: { type: String, default: "Blue", enum: ["Blue", "Silver", "Gold", "Platinum"] },
    notifications: {
      email: {
        applications: { type: Boolean, default: true },
        messages: { type: Boolean, default: true },
        updates: { type: Boolean, default: true }
      },
      inApp: {
        applications: { type: Boolean, default: true },
        messages: { type: Boolean, default: true },
        updates: { type: Boolean, default: true }
      }
    }
  },
  { timestamps: true }
);

// Method to compare password
employerSchema.methods.comparePassword = function (candidatePassword) {
  return this.password === candidatePassword;
};

// Method to get public profile
employerSchema.methods.getPublicProfile = function () {
  const employerObject = this.toObject();
  delete employerObject.password;
  return employerObject;
};

const Employer = mongoose.model("Employer", employerSchema);
module.exports = Employer;
