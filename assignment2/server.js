app.get('/api', (req, res) => {
    res.json({
        message: 'Hello world',
        data: 'This is my first API'
    })
})