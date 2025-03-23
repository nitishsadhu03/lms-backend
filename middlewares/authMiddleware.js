const jwt = require("jsonwebtoken");
const Login = require("../schema/login");
const JWT_SECRET = process.env.JWT_SECRET
const User = require('../schema/login');
const Teacher=require('../schema/teacher');

exports.authenticateUser  = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ error: "Authentication token missing or invalid." });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user details
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: "Invalid user." });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: "Authentication failed." });
  }
};

exports.authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "You are not authorized to perform this action." });
    }
    next();
  };
};

// New middleware to verify if the user is a teacher
exports.verifyTeacher = (req, res, next) => {
  if (req.user.role !== "teacher") {
    return res.status(403).json({ error: "You are not authorized to perform this action." });
  }
  next();
};

 // Assuming the User model is stored in login.js


// Middleware to authenticate user and check if they are admin
exports.authenticateAdmin = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Find the user by ID (assuming user details are in the 'Login' model)
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Check if the user has the 'admin' role
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. You are not an admin.' });
    }

    // Attach user info to the request object
    req.user = user;
    next();  // Proceed to the next middleware/route handler
  } catch (error) {
    return res.status(400).json({ message: 'Invalid token.', error: error.message });
  }
};


const Student=require('../schema/student')
exports.authenticateStudent1 = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verify it's a student token
    if (decoded.role !== 'student') {
      return res.status(403).json({ message: 'Access denied. Not a student token.' });
    }

    // Use roleId from token since that contains the actual student ID
    const student = await Student.findById(decoded.roleId);
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    // Set both the full student object and just the ID
    req.student = student;
    req.studentId = student._id; // Add this line

    next();
  } catch (error) {
    console.error('Auth Error:', error);
    return res.status(400).json({ message: 'Invalid token.', error: error.message });
  }
};

// Middleware to check if the user is a student
exports.studentCheck = (req, res, next) => {
  try {
    // 1. Get the token from the Authorization header
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: "Authorization token is required." });
    }

    // 2. Decode the token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return res.status(401).json({ message: "Invalid or expired token." });
    }

    const { role } = decoded;

    // 3. Check if the user is a student
    if (role !== 'student') {
      return res.status(403).json({ message: "You are not authorized to access this resource." });
    }

    // 4. Attach the decoded token to the request object
    req.user = decoded;

    // 5. Proceed to the next middleware or route handler
    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error verifying user role.",
      error: error.message,
    });
  }
};


// exports.teacherCheck = (req, res, next) => {
//   const token = req.header('Authorization')?.replace('Bearer ', '');

//   if (!token) {
//     return res.status(401).json({ message: "Authorization token required." });
//   }

//   try {
//     // Verify the token
//     const decoded = jwt.verify(token, JWT_SECRET);

//     // Attach the decoded user data to the request object
//     req.user = decoded; // This will contain the teacher's ID and role

//     // Ensure the user is a teacher
//     if (decoded.role !== 'teacher') {
//       return res.status(403).json({ message: "Unauthorized access. You must be a teacher to assign homework." });
//     }
//     // console.log('Decoded JWT Token:', decoded); // This will show the token payload


//     next(); // Proceed to the next middleware or controller
//   } catch (error) {
//     res.status(401).json({ message: "Invalid or expired token." });
//   }
// };



// exports.authenticateTeacher = async (req, res, next) => {
//   const token = req.header('Authorization')?.replace('Bearer ', '');
  
//   if (!token) {
//     return res.status(401).json({ message: 'Access denied. No token provided.' });
//   }

//   try {
//     const decoded = jwt.verify(token, JWT_SECRET);
//     const teacher = await Teacher.findById(decoded.id);
    
//     if (!teacher) {
//       return res.status(404).json({ message: 'Teacher not found.' });
//     }

//     req.teacher = teacher;
//     next();
//   } catch (error) {
//     return res.status(400).json({ message: 'Invalid token.', error: error.message });
//   }
// };
// Middleware to authenticate and authorize a teacher

const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error("Invalid or expired token.");
  }
};
exports.authenticateTeacher = async (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    console.log("No token provided."); // Debugging
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  try {
    // Verify the token
    const decoded = verifyToken(token);
    // console.log("Decoded Token:", decoded); // Debugging: Log the decoded token

    // Ensure the token belongs to a teacher
    if (decoded.role !== "teacher") {
      console.log("Access denied. Not a teacher token."); // Debugging
      return res.status(403).json({ message: "Access denied. Not a teacher token." });
    }

    // Fetch the teacher from the database
    const teacher = await Teacher.findById(decoded.roleId || decoded.id);
    if (!teacher) {
      console.log("Teacher not found."); // Debugging
      return res.status(404).json({ message: "Teacher not found." });
    }

    // Attach the teacher to the request object as `req.user`
    req.user = teacher; // Updated this line
    next();
  } catch (error) {
    console.error("Authentication Error:", error.message); // Debugging
    res.status(401).json({ message: error.message });
  }
};

// Middleware to check if the user is a teacher
exports.teacherCheck = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ message: "Authorization token required." });
  }

  try {
    // Verify the token
    const decoded = verifyToken(token);
    console.log("Decoded Token:", decoded); // Debugging: Log the decoded token

    // Ensure the user is a teacher
    if (decoded.role !== "teacher") {
      return res.status(403).json({ message: "Unauthorized access. You must be a teacher." });
    }

    // Attach the decoded user data to the request object
    req.user = decoded;
    next();
  } catch (error) {
    console.error("Token Verification Error:", error.message); // Debugging: Log the error
    res.status(401).json({ message: error.message });
  }
};

// Replace your current authenticateStudent function with this:
exports.authenticateStudent = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Fix: Capitalize the model name and reference it correctly
    const Student = require('../schema/student');
    const studentData = await Student.findById(decoded.roleId || decoded.id);
    
    if (!studentData) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    // Set both the full student object and the ID
    req.student = studentData;
    req.studentId = studentData._id;
    
    next();
  } catch (error) {
    return res.status(400).json({ message: 'Invalid token.', error: error.message });
  }
};


exports.authenticateTeacher1 = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verify it's a teacher token
    if (decoded.role !== 'teacher') {
      return res.status(403).json({ message: 'Access denied. Not a teacher token.' });
    }

    // Use roleId instead of id since that contains the actual teacher ID
    const teacher = await Teacher.findById(decoded.roleId);
    
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found.' });
    }

    req.teacher = teacher;
    next();
  } catch (error) {
    console.error('Auth Error:', error);
    return res.status(400).json({ message: 'Invalid token.', error: error.message });
  }
};