const bcrypt = require('bcrypt');
const saltRounds = 10;
const db = require('../models/index');
const Subscriber = db.subscriber;
const Branch = db.branch;
const Machine = db.machine;
const Op = db.Sequelize.Op;

exports.getAllSubscribers = async (req, res) => {
    try {
        const data = await Subscriber.findAll();
        res.render("subscribers/getSubscriber", { subscribers: data });
    } catch (err) {
        res.status(500).send({
            message: err.message
        });
    }
};

exports.getSubscriptionPage = (req, res) => {
    res.render("subscribers/subscriber");
};

exports.saveSubscriber = async (req, res) => {
    try {
        const { name, email, password, role, phoneNumber, cardNumber, branchName, address } = req.body;
        const existingSubscriber = await Subscriber.findOne({ where: { email } });

        if (existingSubscriber) {
            return res.status(400).send({ message: "이미 등록된 이메일 주소입니다." });
        }

        if (password.length < 8) {
            return res.status(400).send({ message: "비밀번호는 8자리 이상이어야 합니다." });
        }

        if (role === 'admin' && (!branchName || !address)) {
            return res.status(400).send({ message: "관리자 역할을 선택하셨습니다. 지점명과 주소를 입력해 주세요." });
        }

        const hashedPassword = await bcrypt.hash(password, saltRounds);

        if (role === 'admin') {
            const existingBranch = await Branch.findOne({ where: { branchName } });
            if (existingBranch) {
                return res.status(400).send({ message: "이미 등록된 지점명입니다." });
            }

            const newBranch = await Branch.create({
                branchName,
                address,
                manager: email
            });

            const machines = [];
            for (let i = 1; i <= 4; i++) {
                machines.push({ type: 'washer', state: 'available', branchID: newBranch.branchID });
                machines.push({ type: 'dryer', state: 'available', branchID: newBranch.branchID });
            }
            await Machine.bulkCreate(machines);
        }

        await Subscriber.create({
            name,
            email,
            password: hashedPassword,
            role,
            phoneNumber,
            cardNumber,
            branchName: role === 'admin' ? branchName : null,
            address: role === 'admin' ? address : null
        });

        res.send("회원가입이 완료되었습니다. 인증 코드를 이메일로 전송하였습니다.");
    } catch (err) {
        res.status(500).send({
            message: err.message
        });
    }
};








