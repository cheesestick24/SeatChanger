import { expect, describe, it } from 'vitest'
import request from 'supertest';
import app from '../api.mjs'

describe('POST /shuffle', () => {
    // 基本的なエンドポイントのテスト
    it('should return a 200 status and a JSON object', async () => {
        const response = await request(app)
            .post('/shuffle')
            .send({
                students: 32,
                rows: 4,
                cols: 8,
                forbiddenPairs: [],
                fixedSeats: []
            });
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('seating');
        expect(response.body).toHaveProperty('overflow');
    });

    // 固定席のテスト
    it('should handle fixed seats correctly', async () => {
        const response = await request(app)
            .post('/shuffle')
            .send({
                students: 32,
                rows: 4,
                cols: 8,
                forbiddenPairs: [],
                fixedSeats: [{ student: 1, row: 0, col: 0 }]
            });
        expect(response.status).toBe(200);
        expect(response.body.seating[0][0]).toBe(1);
    });

    // 隣に座らせたくないペアのテスト
    it('should handle forbidden pairs correctly', async () => {
        const response = await request(app)
            .post('/shuffle')
            .send({
                students: 32,
                rows: 4,
                cols: 8,
                forbiddenPairs: [[1, 2]],
                fixedSeats: []
            });
        expect(response.status).toBe(200);
        const seating = response.body.seating;
        let pairwiseConflict = false;

        // 横方向の隣接をチェック
        for (let r = 0; r < seating.length; r++) {
            for (let c = 0; c < seating[r].length - 1; c++) {
                const pair = [seating[r][c], seating[r][c + 1]];
                if (pair.includes(1) && pair.includes(2)) {
                    pairwiseConflict = true;
                    break;
                }
            }
            if (pairwiseConflict) break;
        }

        // 縦方向の隣接をチェック
        if (!pairwiseConflict) {
            for (let c = 0; c < seating[0].length; c++) {
                for (let r = 0; r < seating.length - 1; r++) {
                    const pair = [seating[r][c], seating[r + 1][c]];
                    if (pair.includes(1) && pair.includes(2)) {
                        pairwiseConflict = true;
                        break;
                    }
                }
                if (pairwiseConflict) break;
            }
        }

        expect(pairwiseConflict).toBe(false);
    });

    // 固定席と隣に座らせたくないペアの組み合わせのテスト
    it('should not allow forbidden pairs to be adjacent when using fixed seats', async () => {
        // テストリクエストを送信
        const response = await request(app)
            .post('/shuffle')
            .send({
                students: 32, // 生徒の数
                rows: 4, // 行数
                cols: 8, // 列数
                forbiddenPairs: [[1, 2]], // 隣に座らせたくないペア
                fixedSeats: [{ student: 1, row: 0, col: 0 }, { student: 2, row: 0, col: 2 }] // 固定席の設定
            });
        expect(response.status).toBe(200); // ステータスコードが200であることを確認

        const seating = response.body.seating; // 席配置を取得
        let pairwiseConflict = false; // 隣接する禁止ペアがあるかどうかのフラグ

        // 横方向の隣接をチェック
        for (let r = 0; r < seating.length; r++) {
            for (let c = 0; c < seating[r].length - 1; c++) {
                const pair = [seating[r][c], seating[r][c + 1]]; // 隣接するペアを取得
                if (pair.includes(1) && pair.includes(2)) { // 禁止ペアが隣接しているかチェック
                    pairwiseConflict = true;
                    break;
                }
            }
            if (pairwiseConflict) break;
        }

        // 縦方向の隣接をチェック
        if (!pairwiseConflict) {
            for (let c = 0; c < seating[0].length; c++) {
                for (let r = 0; r < seating.length - 1; r++) {
                    const pair = [seating[r][c], seating[r + 1][c]]; // 隣接するペアを取得
                    if (pair.includes(1) && pair.includes(2)) { // 禁止ペアが隣接しているかチェック
                        pairwiseConflict = true;
                        break;
                    }
                }
                if (pairwiseConflict) break;
            }
        }

        expect(pairwiseConflict).toBe(false); // 禁止ペアが隣接していないことを確認
    });

    // 固定席を設定した後に隣に座らせたくないペアを追加しようとした場合のテスト
    it('should not allow adding forbidden pairs that are already adjacent due to fixed seats', async () => {
        // 固定席を設定
        const fixedSeatsResponse = await request(app)
            .post('/shuffle')
            .send({
                students: 32,
                rows: 4,
                cols: 8,
                forbiddenPairs: [],
                fixedSeats: [{ student: 1, row: 0, col: 0 }, { student: 2, row: 0, col: 1 }]
            });
        expect(fixedSeatsResponse.status).toBe(200);

        // 隣に座らせたくないペアを追加しようとする
        const forbiddenPairsResponse = await request(app)
            .post('/shuffle')
            .send({
                students: 32,
                rows: 4,
                cols: 8,
                forbiddenPairs: [[1, 2]],
                fixedSeats: [{ student: 1, row: 0, col: 0 }, { student: 2, row: 0, col: 1 }]
            });
        expect(forbiddenPairsResponse.status).toBe(200);
        expect(forbiddenPairsResponse.body.pairwiseConflict).toBe(true); // 隣接する禁止ペアがあることを確認
    });

    // 固定席が設定されている場合の席替えのテスト
    it('should shuffle seats correctly with fixed seats', async () => {
        const response = await request(app)
            .post('/shuffle')
            .send({
                students: 32,
                rows: 4,
                cols: 8,
                forbiddenPairs: [],
                fixedSeats: [{ student: 1, row: 0, col: 0 }, { student: 2, row: 0, col: 1 }]
            });
        expect(response.status).toBe(200);
        const seating = response.body.seating;
        expect(seating[0][0]).toBe(1);
        expect(seating[0][1]).toBe(2);
    });

    // 生徒数が席数を超える場合のテスト
    it('should handle overflow students correctly', async () => {
        const response = await request(app)
            .post('/shuffle')
            .send({
                students: 40,
                rows: 4,
                cols: 8,
                forbiddenPairs: [],
                fixedSeats: []
            });
        expect(response.status).toBe(200);
        const seating = response.body.seating;
        const overflow = response.body.overflow;
        expect(overflow.length).toBe(8); // 8人の生徒が溢れるはず
        expect(seating.flat().filter(seat => seat !== null).length).toBe(32); // 32人の生徒が配置されるはず
    });

    // 固定席が設定されている場合の席替えのテスト（溢れた生徒がいる場合）
    it('should handle fixed seats correctly with overflow students', async () => {
        const response = await request(app)
            .post('/shuffle')
            .send({
                students: 40,
                rows: 4,
                cols: 8,
                forbiddenPairs: [],
                fixedSeats: [{ student: 1, row: 0, col: 0 }, { student: 2, row: 0, col: 1 }]
            });
        expect(response.status).toBe(200);
        const seating = response.body.seating;
        const overflow = response.body.overflow;
        expect(seating[0][0]).toBe(1);
        expect(seating[0][1]).toBe(2);
        expect(overflow.length).toBe(8); // 8人の生徒が溢れるはず
    });

    // 固定席が設定されている場合の席替えのテスト（隣に座らせたくないペアが隣接していないことを確認）
    it('should not allow forbidden pairs to be adjacent with fixed seats', async () => {
        const response = await request(app)
            .post('/shuffle')
            .send({
                students: 32,
                rows: 4,
                cols: 8,
                forbiddenPairs: [[1, 2]],
                fixedSeats: [{ student: 1, row: 0, col: 0 }, { student: 2, row: 0, col: 2 }]
            });
        expect(response.status).toBe(200);
        const seating = response.body.seating;
        let pairwiseConflict = false;

        // 横方向の隣接をチェック
        for (let r = 0; r < seating.length; r++) {
            for (let c = 0; c < seating[r].length - 1; c++) {
                const pair = [seating[r][c], seating[r][c + 1]];
                if (pair.includes(1) && pair.includes(2)) {
                    pairwiseConflict = true;
                    break;
                }
            }
            if (pairwiseConflict) break;
        }

        // 縦方向の隣接をチェック
        if (!pairwiseConflict) {
            for (let c = 0; c < seating[0].length; c++) {
                for (let r = 0; r < seating.length - 1; r++) {
                    const pair = [seating[r][c], seating[r + 1][c]];
                    if (pair.includes(1) && pair.includes(2)) {
                        pairwiseConflict = true;
                        break;
                    }
                }
                if (pairwiseConflict) break;
            }
        }

        expect(pairwiseConflict).toBe(false);
    });
});
