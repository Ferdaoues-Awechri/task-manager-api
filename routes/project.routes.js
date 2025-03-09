const express = require("express");
const Project = require("../models/Project");
const User = require("../models/User"); 
const Invitation = require("../models/Invitation");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

//new project
router.post("/new", authMiddleware, async (req, res) => {
  try {
      const { name, description, start_date, end_date, priority, status } = req.body;

      // Create the new project (without collaborators initially)
      const newProject = new Project({
          name,
          description,
          start_date,
          end_date,
          priority,
          status,
          admin: req.user.id,
      });

      await newProject.save();
      res.status(201).json({ message: "Project created successfully", project: newProject });
  } catch (error) {
      console.error("Error creating project:", error);
      res.status(500).json({ message: "Error creating project", error: error.message });
  }
});


router.get("/all", authMiddleware, async (req, res) => {
  try {
    const projects = await Project.find({ admin: req.user.id });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: "Error fetching projects", error: error.message });
  }
});


// View project details
router.get('/projects/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id); // Récupérer le projet par son ID
    if (!project) {
      return res.status(404).json({ message: "Projet introuvable" });
    }
    res.json(project); // Renvoyer les données du projet
  } catch (error) {
    console.error("Erreur dans la récupération du projet :", error);
    res.status(500).json({ message: "Erreur interne du serveur" });
  }
});

// View project details with authorization
router.get('/projects/:id', authMiddleware, async (req, res) => {
  try {
    // Find project by ID and populate admin details
    const project = await Project.findById(req.params.id)
      .populate('admin', 'username email') // Populate admin's basic info
      .lean(); // Convert to plain JavaScript object

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Optional: Check if user has permission to view this project
    // Assuming admin is stored as an ObjectId reference
    if (project.admin._id.toString() !== req.user.id) {
      return res.status(403).json({ 
        message: "Unauthorized: You don't have permission to view this project" 
      });
    }

    res.status(200).json({
      message: "Project details retrieved successfully",
      project
    });
  } catch (error) {
    console.error("Error fetching project details:", error);
    res.status(500).json({ 
      message: "Error retrieving project details", 
      error: error.message 
    });
  }
});



  //edit project
  router.put("/edit/:id", authMiddleware, async (req, res) => {
    try {
      const { id } = req.params; // ID du projet à modifier
      const { name, description, start_date, end_date, priority, status} = req.body;
  
      // Vérifier si le projet existe
      const project = await Project.findById(id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
  
    
      // Mettre à jour les champs du projet
      project.name = name || project.name;
      project.description = description || project.description;
      project.start_date = start_date || project.start_date;
      project.end_date = end_date || project.end_date;
      project.priority = priority || project.priority;
      project.status = status || project.status;

      // Sauvegarder les modifications
      await project.save();
      
      res.status(200).json({ message: "Project updated successfully", project });
    } catch (error) {
      console.error("Error updating project:", error);
      res.status(500).json({ message: "Error updating project", error: error.message });
    }
  });

//delete project
router.delete('/delete/:id', async (req, res) => {
  try {
      const { id } = req.params;
      console.log("Deleting project with ID:", id);

      const project = await Project.findByIdAndDelete(id);
      if (!project) {
          return res.status(404).json({ message: 'Project not found' });
      }

      res.status(200).json({ message: 'Project deleted successfully', project });
  } catch (err) {
      res.status(500).json({ message: err.message });
  }
});



module.exports = router;
