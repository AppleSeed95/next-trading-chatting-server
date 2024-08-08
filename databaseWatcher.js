const { connection, executeQuery } = require('./connection');

connection.connect(async (error) => {
    if (error) {
        console.error("Error occurred while connecting to the database:", error);
    } else {
        console.log('successfully connected to the database');
    }
});


exports.watchDatabase = async () => {
    const companyQuery = 'SELECT * FROM company';
    const companies = await executeQuery(companyQuery);
    await Promise.all(
        companies.map(async ({ id }) => {

            const queryForCompany = `SELECT * FROM company WHERE id = '${id}'`;
            const result = await executeQuery(queryForCompany).catch((e) => {
                throw new Error("something went wrong");
            });

            if (result.length === 0) {
                return NextResponse.json({
                    type: "error",
                    msg: "入力に誤りがあります。",
                });
            }
            const company = result[0];

            let possibleAutoCollectionCnt = Math.min(
                company.monthlyCollectionCnt - company.thisMonthCollectionCnt,
                company.concurrentCollectionCnt - company.conCurrentCnt
            );
            if (possibleAutoCollectionCnt < 0) {
                possibleAutoCollectionCnt = 0;
            } else {
                console.log(`${possibleAutoCollectionCnt} cases of company ${company.companyName} are available to start`);
            }

            const countQuery = `
              SELECT COUNT(*) AS cnt
              FROM cases
              WHERE companyId = ${id}
              AND status = '承認'
              AND collectionStatus != '停止中'
              AND collectionStatus != '募集終了'
              AND collectionStatus != '完了'
              AND collectionStatus != '募集中'
              AND autoStart = 1
              AND collectionStart < NOW()
              AND collectionStart IS NOT NULL
              AND collectionStart <> '' 
              `;
            const count = await executeQuery(countQuery).catch((e) => {
                throw new Error("something went wrong");
            });

            const updateQuery = `
            UPDATE cases
              SET collectionStatus = '募集中'
              WHERE companyId = ${id}
              AND status = '承認'
              AND collectionStatus != '停止中'
              AND collectionStatus != '募集終了'
              AND collectionStatus != '完了'
              AND collectionStatus != '募集中'
              AND autoStart = 1
              AND collectionStart < NOW()
              AND collectionStart IS NOT NULL
              AND collectionStart <> '' 
              LIMIT ${company.freeAccount ? 1000 : possibleAutoCollectionCnt}  
              `;

            await executeQuery(updateQuery).catch((e) => {
                throw new Error("something went wrong");
            });
            const countQuery1 = `
            SELECT COUNT(*) AS cnt
            FROM cases
            WHERE companyId = ${id}
              AND collectionStatus = '募集中'
              AND collectionEnd < NOW()
              AND collectionEnd IS NOT NULL
              AND collectionEnd <> ''
            `;
            const count1 = await executeQuery(countQuery1).catch((e) => {
                throw new Error("something went wrong");
            });
            if (count1[0].cnt > 0) {
                console.log(`${count1[0].cnt} cases of company ${company.companyName} are available to end`);
            }
            const updateQuery1 = `UPDATE cases
              SET collectionStatus = '募集終了'
              WHERE companyId = ${id}
              AND collectionStatus = '募集中'
              AND collectionEnd < NOW()
              AND collectionEnd IS NOT NULL
              AND collectionEnd <> ''
              `;

            await executeQuery(updateQuery1).catch((e) => {
                throw new Error("something went wrong");
            });

            const collectionEndedCasesQuery = `SELECT * from cases WHERE collectionStatus = '募集終了' and companyId = ${id}`;
            const collectionEndedCases = await executeQuery(collectionEndedCasesQuery);
            await Promise.all(
                collectionEndedCases.map((async (element) => {
                    const updateQuery2 = `UPDATE cases SET collectionStatus = '完了'
                    WHERE id = ${element.id} and collectionStatus = '募集終了' and (SELECT COUNT(*) FROM apply WHERE caseId = ${element.id} and (status = '承認' OR status = '完了報告')) = 0
                    and (SELECT COUNT(*) FROM apply WHERE caseId = ${element.id} and status = '申請中') = 0
                    `;
                    const test = await executeQuery(updateQuery2);
                }))
            )
            const autoStartedCnt = company.freeAccount
                ? count[0].cnt
                : Math.min(possibleAutoCollectionCnt, count[0].cnt);
            const autoEndedCnt = count1[0].cnt;
            let concurrentDiffuse = autoStartedCnt - autoEndedCnt;
            const updateCompanyQuery = `
            UPDATE company
            SET thisMonthCollectionCnt = thisMonthCollectionCnt + ${autoStartedCnt},
            conCurrentCnt = conCurrentCnt + ${concurrentDiffuse}
            WHERE id = ${id}
            `;

            await executeQuery(updateCompanyQuery).catch((e) => {
                throw new Error("something went wrong");
                return NextResponse.json({ type: "error" });
            });
            const query = `SELECT * FROM cases where companyId = ${id} ORDER BY id DESC`;
            const rows = await executeQuery(query).catch((e) => {
                throw new Error("something went wrong");
            });
        })
    );
};