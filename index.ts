import express from 'express';
import session from 'express-session';
import { handlePayment } from './handlers/payments';
import { handleUser } from './handlers/users';
import { handleNotification } from './handlers/notifications';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
}));

app.get('/', (req, res) => {
    res.send('Smart Promo Hub is running!');
});

app.get('/validation-key.txt', (req, res) => {
    res.send('ضع مفتاح التحقق هنا');
});

app.listen(port, () => {
    console.log(`App running on port ${port}`);
});
