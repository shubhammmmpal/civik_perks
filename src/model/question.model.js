import mongoose from "mongoose";

const SubCategorySchema = new mongoose.Schema({
  subCategoryIndex: {
    type: Number,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    required: false
  },
  requiresImage: {
    type: Boolean,
    default: false
  }
}, { _id: false });


const CategorySchema = new mongoose.Schema({
  categoryIndex: {
    type: Number,
    required: true
  },
  categoryName: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    required: false
  },
  subCategories: [SubCategorySchema]
}, { _id: false });


const QuestionSchema = new mongoose.Schema({
  questionIndex: {
    type: Number,
    required: true,
    unique: true
  },
  question: {
    type: String,
    required: true
  },
  categories: [CategorySchema]
}, {
  timestamps: true
});

export default mongoose.model("Question", QuestionSchema);