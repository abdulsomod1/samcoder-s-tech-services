const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const app = express();

app.use(express.json());
app.use(express.static('.'));

// Supabase configuration
const supabaseUrl = 'https://bdavjlluaniklekedfpz.supabase.co';
const supabaseKey = 'sb_publishable_QylR_YspnbuapMaFAnLM7g_42cMVXCB';
const supabase = createClient(supabaseUrl, supabaseKey);

// Get reviews
app.get('/api/reviews', async (req, res) => {
    try {
        const { data: reviews, error } = await supabase
            .from('reviews')
            .select('*')
            .order('id', { ascending: false });

        if (error) {
            console.error('Supabase error:', error);
            return res.status(500).json({ error: 'Failed to load reviews' });
        }

        res.json(reviews);
    } catch (error) {
        console.error('GET /api/reviews error:', error);
        res.status(500).json({ error: 'Failed to load reviews' });
    }
});

// Submit review
app.post('/api/reviews', async (req, res) => {
    try {
        const { name, location, stars, text } = req.body;
        console.log('POST /api/reviews - body:', req.body);
        if (!name || !location || !stars || !text) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const { data: newReview, error } = await supabase
            .from('reviews')
            .insert([{ name, location, stars, text }])
            .select()
            .single();

        if (error) {
            console.error('Supabase insert error:', error);
            return res.status(500).json({ error: 'Failed to save review' });
        }

        res.json({ success: true, review: newReview });
    } catch (error) {
        console.error('POST /api/reviews error:', error);
        res.status(500).json({ error: 'Failed to save review' });
    }
});

if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

module.exports = app;
