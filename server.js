const express = require('express');
const multer = require('multer');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

const upload = multer({ dest: 'uploads/' });

app.post('/upload', upload.fields([{ name: 'video' }, { name: 'music' }]), async (req, res) => {
  const video = req.files['video'][0];
  const music = req.files['music'][0];
  const outputFile = `processed_${Date.now()}.mp4`;
  const outputPath = path.join(__dirname, 'outputs', outputFile);

  if (!fs.existsSync('outputs')) fs.mkdirSync('outputs');

  const cmd = `ffmpeg -y -i ${video.path} -i ${music.path} -filter_complex "[1:a]volume=0.3[a1];[0:a][a1]amix=inputs=2:duration=first:dropout_transition=3" -shortest -c:v copy -c:a aac ${outputPath}`;

  exec(cmd, (error) => {
    if (error) {
      console.error('FFmpeg Error:', error.message);
      return res.status(500).send('Processing error');
    }

    res.download(outputPath, () => {
      fs.unlinkSync(video.path);
      fs.unlinkSync(music.path);
      setTimeout(() => {
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      }, 60000);
    });
  });
});

app.get('/', (req, res) => res.send('🎬 FFmpeg Video Processor API is Running'));

app.listen(port, () => console.log(`Server running on port ${port}`));
