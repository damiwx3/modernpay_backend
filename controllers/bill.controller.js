const db = require('../models');
const vtpassAxios = require('../utils/vtpass');

// 1. List all VTPass services
let cachedServices = null;
let lastFetchTime = 0;

exports.getCategories = async (req, res) => {
  try {
    const now = Date.now();
    // Refresh cache every 10 minutes
    if (!cachedServices || now - lastFetchTime > 10 * 60 * 1000) {
      const vtpassRes = await vtpassAxios.get('/services');
      cachedServices = vtpassRes.data.content;
      lastFetchTime = now;
    }
    res.status(200).json({ categories: cachedServices });
  } catch (err) {
    if (cachedServices) {
      // Serve cached data if available
      res.status(200).json({ categories: cachedServices, warning: 'Serving cached data' });
    } else {
      res.status(500).json({ message: 'Failed to fetch categories', error: err.message });
    }
  }
};
// 2. Get Airtime categories (filter from /services)
exports.getAirtimeCategories = async (req, res) => {
  try {
    const vtpassRes = await vtpassAxios.get('/services');
    const airtime = vtpassRes.data.content.filter(s => s.service_type === 'airtime');
    res.json({ categories: airtime });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch airtime categories', error: err.message });
  }
};

// 3. Get Data categories (filter from /services)
exports.getDataCategories = async (req, res) => {
  try {
    const vtpassRes = await vtpassAxios.get('/services');
    const data = vtpassRes.data.content.filter(s => s.service_type === 'data');
    res.json({ categories: data });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch data categories', error: err.message });
  }
};

// 4. Validate customer (e.g. smartcard, meter, etc.)
exports.validateCustomer = async (req, res) => {
  const { serviceID, billersCode, type } = req.body;
  if (!serviceID || !billersCode) {
    return res.status(400).json({ message: 'serviceID and billersCode are required' });
  }
  try {
    const response = await vtpassAxios.post('/merchant-verify', {
      serviceID,
      billersCode,
      type
    });
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ message: 'VTPass validation failed', error: err.message });
  }
};

// 5. Pay a bill (Airtime, Data, Electricity, TV, etc.)
exports.payBill = async (req, res) => {
  const { serviceID, billersCode, variation_code, amount, phone } = req.body;
  if (!serviceID || !billersCode || !amount || !phone) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  try {
    const request_id = `BILL-${Date.now()}`;
    const payload = {
      request_id,
      serviceID,
      billersCode,
      variation_code,
      amount,
      phone
    };
    const response = await vtpassAxios.post('/pay', payload);

     // Save record (PUT THIS HERE)
    await db.BillPayment.create({
      userId: req.user.id,
      serviceType: serviceID,
      amount,
      reference: request_id,
      status: response.data.code === '000' ? 'success' : 'failed',
      customer: billersCode,
      responseData: response.data,
      paidAt: response.data.code === '000' ? new Date() : null
    });

    res.status(201).json({
      message: response.data.response_description,
      status: response.data.code === '000' ? 'success' : 'failed',
      data: response.data,
      reference: request_id
    });
  } catch (err) {
    res.status(500).json({ message: 'VTPass payment failed', error: err.message });
  }
};

// 6. Fetch user bill history
exports.getHistory = async (req, res) => {
  try {
    const history = await db.BillPayment.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']]
    });
    res.status(200).json({ history });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch history', error: err.message });
  }
};

// 7. Get bundles/variations for a service
exports.getBundles = async (req, res) => {
  const serviceID = req.params.serviceID || req.query.serviceID;
  if (!serviceID) {
    return res.status(400).json({ message: 'serviceID is required' });
  }
  try {
    const response = await vtpassAxios.get(`/service-variations?serviceID=${serviceID}`);
    res.status(200).json({ bundles: response.data.content.variations });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load bundles', error: err.message });
  }
};
