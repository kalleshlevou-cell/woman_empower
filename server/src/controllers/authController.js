const jwt = require('jsonwebtoken');
const Joi = require('joi');
const User = require('../models/User');

const registerSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string()
    .min(8)
    .pattern(/(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])/)
    .required()
    .messages({
      'string.pattern.base': 'Password must contain at least one uppercase letter, one number, and one special character.',
    }),
  pan: Joi.string()
    .pattern(/^[A-Z]{5}[0-9]{4}[A-Z]$/)
    .optional()
    .allow('', null)
    .messages({ 'string.pattern.base': 'Invalid PAN format. Expected: AAAAA0000A' }),
});

function signToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

const register = async (req, res, next) => {
  try {
    const { error, value } = registerSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details.map((d) => d.message).join('; '),
      });
    }

    const { name, email, password, pan } = value;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, error: 'Email already registered.' });
    }

    const user = new User({ name, email, passwordHash: password, pan });
    await user.save();

    const token = signToken(user);
    return res.status(201).json({
      success: true,
      data: {
        token,
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
      },
    });
  } catch (e) {
    next(e);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid credentials.' });
    }

    const token = signToken(user);
    return res.json({
      success: true,
      data: {
        token,
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
      },
    });
  } catch (e) {
    next(e);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }
    return res.json({ success: true, data: user });
  } catch (e) {
    next(e);
  }
};

module.exports = { register, login, getMe };
