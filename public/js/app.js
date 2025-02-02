const app = Vue.createApp({
    data() {
        return {
            students: 32,
            rows: 4,
            cols: 8,
            forbiddenPairs: [],
            fixedSeats: [],
            showForbiddenList: false,
            showFixedSeatList: false,
            seating: Array.from({ length: 4 }, () => Array(8).fill(null)), // 初期化
            selectedStudent1: null,
            selectedStudent2: null,
            selectedFixedStudent: null,
            selectedRow: 0,
            selectedCol: 0,
            forbiddenErrorMessage: "",
            fixedSeatErrorMessage: "",
            errorMessage: "", // 追加
            overflowErrorMessage: "", // 追加
            isGeneratingImage: false, // 追加
            generatedImageUrl: null, // 追加
            isFirstLoad: true // 追加
        };
    },
    computed: {
        availableRows() {
            return Array.from({ length: this.rows }, (_, i) => i);
        },
        availableCols() {
            return Array.from({ length: this.cols }, (_, i) => i);
        }
    },
    watch: {
        students(newVal) {
            if (newVal > this.rows * this.cols) {
                this.errorMessage = "座席数より人数が多いため、一部の学生を配置できません。";
            } else {
                this.errorMessage = "";
            }
        }
    },
    mounted() {
        this.shuffleSeats();
    },
    methods: {
        // 隣に座らせたくないペアを追加します
        addForbiddenPair() {
            if (this.selectedStudent1 && this.selectedStudent2 && this.selectedStudent1 !== this.selectedStudent2) {
                const newPair = [this.selectedStudent1, this.selectedStudent2];
                const isAlreadyAdded = this.forbiddenPairs.some(pair =>
                    (pair[0] === newPair[0] && pair[1] === newPair[1]) ||
                    (pair[0] === newPair[1] && pair[1] === newPair[0])
                );
                const isAdjacent = this.fixedSeats.some(seat => {
                    const [a, b] = newPair;
                    return (
                        (seat.student === a && (
                            (this.seating[seat.row]?.[seat.col - 1] === b) ||
                            (this.seating[seat.row]?.[seat.col + 1] === b) ||
                            (this.seating[seat.row - 1]?.[seat.col] === b) ||
                            (this.seating[seat.row + 1]?.[seat.col] === b)
                        )) ||
                        (seat.student === b && (
                            (this.seating[seat.row]?.[seat.col - 1] === a) ||
                            (this.seating[seat.row]?.[seat.col + 1] === a) ||
                            (this.seating[seat.row - 1]?.[seat.col] === a) ||
                            (this.seating[seat.row + 1]?.[seat.col] === a)
                        ))
                    );
                });
                if (!isAlreadyAdded && !isAdjacent) {
                    this.forbiddenPairs.push(newPair);
                    this.sortForbiddenPairs();
                    this.forbiddenErrorMessage = "";
                } else if (isAdjacent) {
                    this.forbiddenErrorMessage = "このペアは既に隣に座っています。";
                } else {
                    this.forbiddenErrorMessage = "このペアはすでに追加されています。";
                }
            } else {
                this.forbiddenErrorMessage = "無効なペアです。生徒1と生徒2を選択してください。";
            }
        },
        // 隣に座らせたくないペアを削除します
        removeForbiddenPair(index) {
            if (!this.isGeneratingImage) {
                this.forbiddenPairs.splice(index, 1);
                this.sortForbiddenPairs();
            }
        },
        // 隣に座らせたくないペアをソートします
        sortForbiddenPairs() {
            this.forbiddenPairs.sort((a, b) => {
                if (a[0] === b[0]) {
                    return a[1] - b[1];
                }
                return a[0] - b[0];
            });
        },
        // 固定席を追加します
        addFixedSeat() {
            if (this.selectedFixedStudent && this.selectedRow !== null && this.selectedCol !== null) {
                const newFixedSeat = {
                    student: this.selectedFixedStudent,
                    row: this.selectedRow,
                    col: this.selectedCol
                };
                const isAlreadyAdded = this.fixedSeats.some(seat =>
                    seat.student === newFixedSeat.student ||
                    (seat.row === newFixedSeat.row && seat.col === newFixedSeat.col)
                );
                const isForbiddenPair = this.forbiddenPairs.some(pair => {
                    const [a, b] = pair;
                    return (
                        (a === newFixedSeat.student && (
                            (this.seating[newFixedSeat.row]?.[newFixedSeat.col - 1] === b) ||
                            (this.seating[newFixedSeat.row]?.[newFixedSeat.col + 1] === b) ||
                            (this.seating[newFixedSeat.row - 1]?.[newFixedSeat.col] === b) ||
                            (this.seating[newFixedSeat.row + 1]?.[newFixedSeat.col] === b)
                        )) ||
                        (b === newFixedSeat.student && (
                            (this.seating[newFixedSeat.row]?.[newFixedSeat.col - 1] === a) ||
                            (this.seating[newFixedSeat.row]?.[newFixedSeat.col + 1] === a) ||
                            (this.seating[newFixedSeat.row - 1]?.[newFixedSeat.col] === a) ||
                            (this.seating[newFixedSeat.row + 1]?.[newFixedSeat.col] === a)
                        ))
                    );
                });
                if (!isAlreadyAdded && !isForbiddenPair) {
                    this.fixedSeats.push(newFixedSeat);
                    this.seating[newFixedSeat.row][newFixedSeat.col] = newFixedSeat.student; // 座席に固定生徒を配置
                    this.fixedSeatErrorMessage = "";
                } else if (isForbiddenPair) {
                    this.fixedSeatErrorMessage = "この生徒は隣に座らせたくないリストに含まれています。";
                } else {
                    this.fixedSeatErrorMessage = "この生徒または座標はすでに固定されています。";
                }
            } else {
                this.fixedSeatErrorMessage = "無効な固定席です。生徒と座標を選択してください。";
            }
        },
        // 固定席を削除します
        removeFixedSeat(index) {
            if (!this.isGeneratingImage) {
                const seat = this.fixedSeats.splice(index, 1)[0];
                this.seating[seat.row][seat.col] = null; // 座席から固定生徒を削除
            }
        },
        // 席替えを実行し、画像を生成して表示します
        async shuffleSeats() {
            this.isGeneratingImage = true; // 生成中フラグを立てる
            try {
                const response = await fetch("/shuffle", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        students: this.students,
                        rows: this.rows,
                        cols: this.cols,
                        forbiddenPairs: this.forbiddenPairs,
                        fixedSeats: this.fixedSeats
                    })
                });
                const data = await response.json();
                this.seating = data.seating;
                this.overflowStudents = data.overflow;

                // 溢れた生徒がいる場合にエラーメッセージを表示
                if (this.overflowStudents.length > 0) {
                    this.overflowErrorMessage = `${this.overflowStudents.length}人の生徒が配置できませんでした。`;
                } else {
                    this.overflowErrorMessage = "";
                }

                // 初回ロード時は画像を生成しない
                if (!this.isFirstLoad) {
                    // 現在の座席情報を取得
                    const currentSeating = this.seating;

                    const imageResponse = await fetch("/generate-image", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({ seating: currentSeating })
                    });

                    if (!imageResponse.ok) {
                        throw new Error('画像生成中にエラーが発生しました');
                    }

                    const blob = await imageResponse.blob();
                    const url = URL.createObjectURL(blob);
                    this.generatedImageUrl = url; // 生成された画像のURLを更新
                } else {
                    this.isFirstLoad = false; // 初回ロードフラグを下げる
                }
            } catch (error) {
                console.error('Error:', error.message);
            } finally {
                this.isGeneratingImage = false; // 生成中フラグを下げる
            }
        }
    }
});

app.mount('#app');
