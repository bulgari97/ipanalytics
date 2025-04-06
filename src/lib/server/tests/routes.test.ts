import Server from '../server.js';
import supertest from 'supertest';

let app: any;

beforeAll(async () => {
  const server = Server.getInstance(3001); // можно использовать test-порт
  app = supertest(server['fastify'].server);
});

describe('Routes', () => {
  describe('GET /getUAs', () => {
    it('should return 400 if query is missing', async () => {
      const res = await app.get('/getUAs');
      expect(res.statusCode).toBe(400);
    });

    it('should return 200 with valid query', async () => {
      const res = await app.get('/getUAs?key=testKey&start=0&stop=10');
      // В зависимости от реализации logData.getUAs можешь заменить mock или ожидание
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('POST /banIP', () => {
    it('should return 400 if no ip provided', async () => {
      const res = await app.post('/banIP').send({});
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('should return 200 on valid ip', async () => {
      const res = await app.post('/banIP').send({ ip: '127.0.0.1' });
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ message: 'IP banned' });
    });
  });

  describe('POST /banUA', () => {
    it('should return 400 if no UA provided', async () => {
      const res = await app.post('/banUA').send({});
      expect(res.statusCode).toBe(400);
    });

    it('should return 200 on valid UA', async () => {
      const res = await app.post('/banUA').send({ ua: 'MyBot/1.0' });
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ message: 'UA banned' });
    });
  });
});
