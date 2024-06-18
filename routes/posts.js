//sample user token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImlkIjoiNjY2YTU2OTRjZTVkMDdmOWFjMWE4MzAyIn0sImlhdCI6MTcxODI0NTAzNiwiZXhwIjoxNzE4MjQ4NjM2fQ.ZBzSlw7uXqt30mUz3NHHXutZ0gqEC5_D82V7aR1CKp4
// routes/posts.js
const express = require('express');
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const Post = require('../modles/Post');
const router = express.Router();

//const upload = require('../middleware/upload'); // Import multer configuration
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Destination folder for uploads
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname); // Unique filename
    }
});

function fileFilter(req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
}

// Initialize multer instance
const upload = multer({ storage: storage, fileFilter: fileFilter });


// Create a new post
router.post(
    '/',
    upload.single('image'), // Handle single file upload named 'image'
    [
        auth,
        [
            check('title', 'Title is required').not().isEmpty(),
            check('content', 'Content is required').not().isEmpty(),
            check('company', 'Company is required').not().isEmpty()
        ]
    ],
    async (req, res) => {
        try {
            const { title, content, company } = req.body;

            if (!title || !content || !company) {
                return res.status(400).json({ msg: 'Title, content, and company are required' });
            }

            const newPost = new Post({
                title,
                content,
                image: req.file ? req.file.path : '', // Save file path in MongoDB if file was uploaded
                company,
                author: req.user.id
            });

            const savedPost = await newPost.save();
            res.status(201).json(savedPost);
        } catch (err) {
            console.error(err.message);
            res.status(500).json({ msg: 'Server error' });
        }
    }
);

// Edit a post
router.put('/:id', auth, async (req, res) => {
    const { title, content } = req.body;

    // Check if title or content is provided
    if (!title || !content) {
        return res.status(400).json({ msg: 'Title and content are required' });
    }

    try {
        let post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ msg: 'Post not found' });
        }

        // Check if the user is the author or admin
        if (post.author.toString() !== req.user.id && !req.user.isAdmin) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        // Update post
        post.title = title;
        post.content = content;

        await post.save();

        res.json(post);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Delete a post
router.delete('/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ msg: 'Post not found' });
        }

        // Check user
        if (post.author.toString() !== req.user.id && !req.user.isAdmin) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        await post.deleteOne();

        res.json({ msg: 'Post removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Read a post
router.get('/:id', async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ msg: 'Post not found' });
        }

        res.json(post);
    } catch (err) {
        console.error(err.message);

        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Post not found' });
        }

        res.status(500).send('Server Error');
    }
});

// Read all posts
router.get('/', async (req, res) => {
    try {
        const posts = await Post.find().sort({ date: -1 }); // Sort by most recent
        res.json(posts);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Add a comment to a post
router.post(
    '/comment/:id',
    [
        auth,
        [
            check('text', 'Text is required').not().isEmpty()
        ]
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const post = await Post.findById(req.params.id);

            if (!post) {
                return res.status(404).json({ msg: 'Post not found' });
            }

            const newComment = {
                user: req.user.id,
                text: req.body.text
            };

            post.comments.unshift(newComment);

            await post.save();

            res.json(post.comments);
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    }
);

// Delete a comment
router.delete('/comment/:id/:comment_id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ msg: 'Post not found' });
        }

        // Pull out comment
        const comment = post.comments.find(comment => comment.id === req.params.comment_id);

        // Make sure comment exists
        if (!comment) {
            return res.status(404).json({ msg: 'Comment does not exist' });
        }

        // Check user
        if (comment.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        // Get remove index
        const removeIndex = post.comments.map(comment => comment.id).indexOf(req.params.comment_id);

        post.comments.splice(removeIndex, 1);

        await post.save();

        res.json(post.comments);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Add a like to a post
router.put('/like/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ msg: 'Post not found' });
        }

        // Check if the post has already been liked by this user
        if (post.likes.some(like => like.toString() === req.user.id)) {
            return res.status(400).json({ msg: 'Post already liked' });
        }

        post.likes.unshift(req.user.id);
        await post.save();

        res.json(post.likes);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
