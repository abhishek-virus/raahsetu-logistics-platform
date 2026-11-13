
const mongoose = require("mongoose");

const staffSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            match: [
                /^[a-zA-Z0-9._%+-]+@gmail\.com$/,
                "Please enter a valid Gmail address ending with @gmail.com.",
            ],
            index: true,
        },

        passwordHash: {
            type: String,
            required: true,
            select: false,
        },

        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Staff", staffSchema);
