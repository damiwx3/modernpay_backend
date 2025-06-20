const db = require('../models');
const vtpassAxios = require('../utils/vtpass');

// 1. List all VTPass services
let cachedServices = null;
let lastFetchTime = 0;

// In getCategories
exports.getCategories = async (req, res) => {
  try {
    const now = Date.now();
    if (!cachedServices || now - lastFetchTime > 10 * 60 * 1000) {
      const vtpassRes = await vtpassAxios.get('/service-categories');
      console.log('VTPass /service-categories:', vtpassRes.data); // <-- Add this line
      cachedServices = vtpassRes.data.content;
      lastFetchTime = now;
    }
    res.status(200).json({ categories: cachedServices });
  } catch (err) {
    console.error('VTPass error (getCategories):', err.response?.data || err.message);
    if (cachedServices) {
      res.status(200).json({ categories: cachedServices, warning: 'Serving cached data' });
    } else {
      res.status(500).json({ message: 'Failed to fetch categories', error: err.message });
    }
  }
};

// 2. Get Airtime categories (filter from /services)
exports.getAirtimeCategories = async (req, res) => {
  try {
    const vtpassRes = await vtpassAxios.get('/services?identifier=airtime');
    if (!Array.isArray(vtpassRes.data.content)) {
      return res.status(500).json({ message: 'VTPass /services error', error: vtpassRes.data });
    }
    const mapped = vtpassRes.data.content.map(item => ({
      code: item.serviceID,
      name: item.name,
      minAmount: item.minimium_amount,
      maxAmount: item.maximum_amount,
      fee: item.convinience_fee,
      type: item.product_type,
      image: item.image,
    }));
    res.json({ categories: mapped });
  } catch (err) {
    console.error('VTPass error (getAirtimeCategories):', err.response?.data || err.message);
    res.status(500).json({ message: 'Failed to fetch airtime categories', error: err.message });
  }
};

// 3. Get Data categories (filter from /services)
exports.getDataCategories = async (req, res) => {
  try {
    const vtpassRes = await vtpassAxios.get('/services?identifier=data');
    if (!Array.isArray(vtpassRes.data.content)) {
      return res.status(500).json({ message: 'VTPass /services error', error: vtpassRes.data });
    }
    const mapped = vtpassRes.data.content.map(item => ({
      ...item,
      biller_code: item.serviceID,
    }));
    res.json({ categories: mapped });
  } catch (err) {
    console.error('VTPass error (getDataCategories):', err.response?.data || err.message);
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
    console.error('VTPass error (validateCustomer):', err.response?.data || err.message);
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
    // Build payload
    const payload = {
      request_id,
      serviceID,
      billersCode,
      amount,
      phone
    };
    // Only add variation_code if present (for data, TV, etc.)
    if (variation_code) {
      payload.variation_code = variation_code;
    }
    // Debug: log payload
    console.log('VTPass PAY payload:', payload);

    const response = await vtpassAxios.post('/pay', payload);
    // Debug: log VTPass response
    console.log('VTPass response:', response.data);

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
    console.error('VTPass error (payBill):', err.response?.data || err.message);
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
    console.error('VTPass error (getHistory):', err.response?.data || err.message);
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
    console.error('VTPass error (getBundles):', err.response?.data || err.message);
    res.status(500).json({ message: 'Failed to load bundles', error: err.message });
  }
};

// 8. Purchase MTN VTU Airtime
exports.purchaseMtnVtu = async (req, res) => {
  const { amount, phone } = req.body;
  if (!amount || !phone) {
    return res.status(400).json({ message: 'amount and phone are required' });
  }
  try {
    const request_id = `MTNVTU-${Date.now()}`;
    const payload = {
      request_id,
      serviceID: 'mtn',
      amount,
      phone,
      billersCode: phone // Required by VTPass for airtime!
    };
    // Debug: log payload
    console.log('VTPass PAY payload:', payload);

    const response = await vtpassAxios.post('/pay', payload);
    // Debug: log VTPass response
    console.log('VTPass response:', response.data);

    await db.BillPayment.create({
      userId: req.user.id,
      serviceType: 'mtn',
      amount,
      reference: request_id,
      status: response.data.code === '000' ? 'success' : 'failed',
      customer: phone,
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
    console.error('VTPass error (purchaseMtnVtu):', err.response?.data || err.message);
    res.status(500).json({ message: 'MTN VTU purchase failed', error: err.message });
  }
};

// 9. Query VTU Transaction Status
exports.queryVtuStatus = async (req, res) => {
  const { request_id } = req.body;
  if (!request_id) {
    return res.status(400).json({ message: 'request_id is required' });
  }
  try {
    const payload = { request_id };
    const response = await vtpassAxios.post('/requery', payload);
    res.status(200).json(response.data);
  } catch (err) {
    console.error('VTPass error (queryVtuStatus):', err.response?.data || err.message);
    res.status(500).json({ message: 'Failed to query VTU status', error: err.message });
  }
};
// Add this to bill.controller.js
exports.getServicesByCategory = async (req, res) => {
  const { identifier } = req.query;
  if (!identifier) {
    return res.status(400).json({ message: 'identifier is required' });
  }
  try {
    const vtpassRes = await vtpassAxios.get(`/services?identifier=${identifier}`);
    console.log(`VTPass /services?identifier=${identifier}:`, vtpassRes.data); // <-- Add this line
    res.status(200).json({ services: vtpassRes.data.content });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch services', error: err.message });
  }
};