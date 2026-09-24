import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../app.js';
import { connectDatabase } from '../config/db.js';
import mongoose from 'mongoose';

test('FleetSphere API Comprehensive Test Suite', async (t) => {
  await connectDatabase();

  let adminCookie = '';
  let driverCookie = '';

  await t.test('Health check endpoint', async () => {
    const res = await request(app).get('/api/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
  });

  await t.test('Admin Login', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'aarav.admin@fleetsphere.test', password: 'FleetSphere@123' });
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.user.role, 'SUPER_ADMIN');
    adminCookie = res.headers['set-cookie'];
  });

  await t.test('Get current admin profile (/api/auth/me)', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', adminCookie);
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.user.email, 'aarav.admin@fleetsphere.test');
  });

  await t.test('Fetch Dashboard Overview as Admin', async () => {
    const res = await request(app)
      .get('/api/dashboard/overview')
      .set('Cookie', adminCookie);
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.totalVehicles > 0);
  });

  await t.test('Driver Login & Dashboard Access', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ravi.kumar@fleetsphere.test', password: 'FleetSphere@123' });
    assert.equal(res.status, 200);
    driverCookie = res.headers['set-cookie'];

    const dashRes = await request(app)
      .get('/api/dashboard/overview')
      .set('Cookie', driverCookie);
    assert.equal(dashRes.status, 200);
    assert.equal(dashRes.body.success, true);
  });

  await t.test('Fetch Vehicles list', async () => {
    const res = await request(app)
      .get('/api/vehicles')
      .set('Cookie', adminCookie);
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.length > 0);
  });

  await t.test('Fetch Drivers list', async () => {
    const res = await request(app)
      .get('/api/drivers')
      .set('Cookie', adminCookie);
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.length > 0);
  });

  await t.test('Fetch Trips list', async () => {
    const res = await request(app)
      .get('/api/trips')
      .set('Cookie', adminCookie);
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.length > 0);
  });

  await t.test('Fetch Assignments list', async () => {
    const res = await request(app)
      .get('/api/assignments')
      .set('Cookie', adminCookie);
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.length > 0);
  });

  await t.test('Create and Clean up a Route', async () => {
    const branchesRes = await request(app).get('/api/branches').set('Cookie', adminCookie);
    const branchId = branchesRes.body.data[0]._id;

    const createRes = await request(app)
      .post('/api/routes')
      .set('Cookie', adminCookie)
      .send({
        name: 'Test Route Hyderabad to Warangal',
        source: 'Hyderabad',
        destination: 'Warangal',
        distance: 150,
        estimatedDuration: 180,
        branch: branchId
      });
    assert.equal(createRes.status, 201);
    const routeId = createRes.body.data._id;

    const delRes = await request(app)
      .delete(`/api/routes/${routeId}`)
      .set('Cookie', adminCookie);
    assert.equal(delRes.status, 200);
  });

  await t.test('Create Incident and Update Status', async () => {
    const vehiclesRes = await request(app).get('/api/vehicles').set('Cookie', adminCookie);
    const vehicleId = vehiclesRes.body.data[0]._id;

    const createInc = await request(app)
      .post('/api/incidents')
      .set('Cookie', adminCookie)
      .send({
        title: 'Flat tyre in yard',
        description: 'Rear right tyre punctured during parking',
        severity: 'LOW',
        vehicle: vehicleId
      });
    assert.equal(createInc.status, 201);
    const incId = createInc.body.data._id;

    const updateStatus = await request(app)
      .patch(`/api/incidents/${incId}/status`)
      .set('Cookie', adminCookie)
      .send({ status: 'RESOLVED' });
    assert.equal(updateStatus.status, 200);
    assert.equal(updateStatus.body.data.status, 'RESOLVED');

    await request(app).delete(`/api/incidents/${incId}`).set('Cookie', adminCookie);
  });

  await t.test('Create and Delete Expense', async () => {
    const vehiclesRes = await request(app).get('/api/vehicles').set('Cookie', adminCookie);
    const vehicleId = vehiclesRes.body.data[0]._id;

    const createExp = await request(app)
      .post('/api/expenses')
      .set('Cookie', adminCookie)
      .send({
        category: 'TOLL',
        amount: 350,
        description: 'ORR Toll Fastag recharge',
        vehicle: vehicleId
      });
    assert.equal(createExp.status, 201);
    const expId = createExp.body.data._id;

    const delRes = await request(app)
      .delete(`/api/expenses/${expId}`)
      .set('Cookie', adminCookie);
    assert.equal(delRes.status, 200);
  });

  await t.test('Register new driver', async () => {
    const testEmail = `newdriver_${Date.now()}@fleetsphere.test`;
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'New Test Driver',
        email: testEmail,
        password: 'Password@123',
        phone: '+91 99887 76655'
      });
    assert.equal(regRes.status, 201);
    assert.equal(regRes.body.success, true);
    assert.equal(regRes.body.data.user.role, 'DRIVER');
  });

  t.after(async () => {
    await mongoose.connection.close();
  });
});
