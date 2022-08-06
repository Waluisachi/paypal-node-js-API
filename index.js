require('dotenv').config();
const express = require('express');
const paypal = require('paypal-rest-sdk');
const ejs = require('ejs');

const app = express();

app.use(express.json());
app.set('view engine', 'ejs');

// Paypal config
paypal.configure({
  'mode': 'sandbox', //sandbox or live
  'client_id': process.env.CLIENT_ID,
  'client_secret': process.env.CLIENT_SECRET
});

// Routes
/***
* @Type function ('/')
* @Params Request (req)
* @Params Response (res)
****/
app.get('/', (req, res) => {
  res.render('index');
})

/***
* @Type function ('/pay')
* @Params Request (req)
* @Params Response (res)
****/
app.post('/pay', (req, res) => {
  const { amount } = req.body;

  const create_payment_json = {
    "intent": "sale",
    "payer": {
        "payment_method": "paypal"
    },
    "redirect_urls": {
        "return_url": "http://localhost:8080/success",
        "cancel_url": "http://localhost:8080/cancel"
    },
    "transactions": [{
        "item_list": {
            "items": [{
                "name": "Sample product",
                "sku": "001",
                "price": amount,
                "currency": "USD",
                "quantity": 1
            }]
        },
        "amount": {
            "currency": "USD",
            "total": "25.00"
        },
        "description": "This is the payment description."
    }]
};


  paypal.payment.create(create_payment_json, function (error, payment) {
      if (error) {
          throw error;
      } else {
          for (let i = 0; i < payment?.links.length; i++) {
            if (payment?.links[i]?.rel === 'approval_url') {
              res.redirect(payment?.links[i]?.href);
            }
          }
      }
  });
});

/***
* @Type function ('/success')
* @Params Request (req)
* @Params Response (res)
****/
app.get('/success', (req, res) => {
  const payerId = req.query.PayerID;
  const paymentId = req.query.paymentId;

  const execute_payment_json = {
    "payer_id": payerId,
    "transactions": [{
      "amount": {
        "currency": "USD",
        "total": "25.00"
      }
    }]
  };

  paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
   if (error) {
       console.log(error.response);
       throw error;
   } else {
       res.status(200).json({
         success: true,
         payment
       });
   }
  });
})


/***
* @Type function ('/cancel')
* @Params Request (req)
* @Params Response (res)
****/
app.get('/cancel', (req, res) => {
  res.status(400).json({
    success: false,
    message: 'Payment cancelled'
  });
})


// Server listen
app.listen(8080, () => console.log("Payment API running on port 8080"));
