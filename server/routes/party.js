import express from 'express';
import Party from '../models/Party.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all active parties
router.get('/', authenticateToken, async (req, res) => {
  try {
    const parties = await Party.find({ isActive: true })
      .populate('createdBy', 'name')
      .sort({ name: 1 });

    res.json(parties);
  } catch (error) {
    console.error('Get parties error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all parties (admin only)
router.get('/all', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const parties = await Party.find()
      .populate('createdBy', 'name')
      .sort({ name: 1 });

    res.json(parties);
  } catch (error) {
    console.error('Get all parties error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new party (admin only)
router.post('/', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Party name is required' });
    }

    // Check if party already exists
    const existingParty = await Party.findOne({ 
      name: name.trim(),
      isActive: true 
    });

    if (existingParty) {
      return res.status(400).json({ message: 'Party name already exists' });
    }

    const party = new Party({
      name: name.trim(),
      description: description?.trim() || '',
      createdBy: req.user.userId
    });

    await party.save();
    await party.populate('createdBy', 'name');

    res.status(201).json(party);
  } catch (error) {
    console.error('Create party error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update party (admin only)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { name, description, isActive } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Party name is required' });
    }

    // Check if another party with the same name exists
    const existingParty = await Party.findOne({ 
      name: name.trim(),
      _id: { $ne: req.params.id },
      isActive: true 
    });

    if (existingParty) {
      return res.status(400).json({ message: 'Party name already exists' });
    }

    const party = await Party.findByIdAndUpdate(
      req.params.id,
      {
        name: name.trim(),
        description: description?.trim() || '',
        isActive: isActive !== undefined ? isActive : true
      },
      { new: true }
    ).populate('createdBy', 'name');

    if (!party) {
      return res.status(404).json({ message: 'Party not found' });
    }

    res.json(party);
  } catch (error) {
    console.error('Update party error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete party (admin only)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const party = await Party.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!party) {
      return res.status(404).json({ message: 'Party not found' });
    }

    res.json({ message: 'Party deleted successfully' });
  } catch (error) {
    console.error('Delete party error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;