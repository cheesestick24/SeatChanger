import { expect, describe, it } from 'vitest'
import request from 'supertest';
import app from '../api.mjs'

describe('POST /generate-image', () => {
    it('should generate an image from the seating chart', async () => {
        const response = await request(app)
            .post('/generate-image')
            .send({
                seating: [
                    [1, 2, 3, 4, 5, 6, 7, 8],
                    [9, 10, 11, 12, 13, 14, 15, 16],
                    [17, 18, 19, 20, 21, 22, 23, 24],
                    [25, 26, 27, 28, 29, 30, 31, 32]
                ]
            });

        expect(response.status).toBe(200);
        expect(response.headers['content-type']).toContain('image/png');
    }, 10000); // タイムアウトを10秒に延長
});
