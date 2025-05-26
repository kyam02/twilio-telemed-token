const express = require('express');
const cors = require('cors');
const twilio = require('twilio');
require('dotenv').config();

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET']
}));

const AccessToken = twilio.jwt.AccessToken;
const VideoGrant = AccessToken.VideoGrant;
const twilioClient = twilio(process.env.TWILIO_API_KEY, process.env.TWILIO_API_SECRET, { accountSid: process.env.TWILIO_ACCOUNT_SID });

app.get('/token', async (req, res) => {
  const { identity, room } = req.query;

  try {
    await twilioClient.video.rooms(room).fetch()
      .catch(async () => {
        await twilioClient.video.rooms.create({
          uniqueName: room,
          type: 'group',
          maxParticipants: 10
        });
      });

    const token = new AccessToken(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_API_KEY,
      process.env.TWILIO_API_SECRET,
      { identity }
    );

    token.addGrant(new VideoGrant({ room }));

    res.send({ token: token.toJwt() });
  } catch (error) {
    console.error('Token generation failed:', error);
    res.status(500).send({ error: 'Token generation failed' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Token server running on port ${PORT}`));
