const _ = require('lodash');
const fs = require('fs');
const { v4 } = require('uuid');
const spawn = require('child_process').spawn;
const { faker } = require('@faker-js/faker');
faker.setLocale('fr')

const messages = require('./data/messages.json');



const tags = [{
    name: 'email',
    faker: faker.internet.email()
}, {
    name: 'phone',
    faker: faker.phone.phoneNumber('+33 6 ## ## ## ##')
}, 
{
    name: 'age',
    faker: `${faker.random.numeric(2)}ans`
}, 
{
    name: 'vital',
    faker: `${_.sample([1, 2])} ${faker.random.numeric(1)}${faker.random.numeric(1)} ${faker.random.numeric(1)}${faker.random.numeric(1)} ${faker.random.numeric(1)}${faker.random.numeric(1)} ${faker.random.numeric(1)}${faker.random.numeric(1)}${faker.random.numeric(1)} ${faker.random.numeric(1)}${faker.random.numeric(1)}${faker.random.numeric(1)} ${faker.random.numeric(1)}${faker.random.numeric(1)}`
}, 
{
    name: 'passport',
    faker: `${faker.random.numeric(1)}${faker.random.numeric(1)}${faker.random.alpha().toUpperCase()}${faker.random.alpha().toUpperCase()}${faker.random.numeric(1)}${faker.random.numeric(1)}${faker.random.numeric(1)}${faker.random.numeric(1)}${faker.random.numeric(1)}`
}, 
{
    name: 'rib',
    faker: `${_.sample(['FR', 'DE'])} ${faker.random.numeric(1)}${faker.random.numeric(1)} ${faker.random.numeric(1)}${faker.random.numeric(1)}${faker.random.numeric(1)}${faker.random.numeric(1)} ${faker.random.numeric(1)}${faker.random.numeric(1)}${faker.random.numeric(1)}${faker.random.numeric(1)} ${faker.random.numeric(1)}${faker.random.numeric(1)}${faker.random.numeric(1)}${faker.random.numeric(1)} ${faker.random.numeric(1)}${faker.random.numeric(1)}${faker.random.numeric(1)}${faker.random.numeric(1)} ${faker.random.numeric(1)}${faker.random.numeric(1)}`
}, 
{
    name: 'nationality',
    faker: faker.address.country()
}, 
{
    name: 'situation_familiale',
    faker: _.sample(['marié', 'pacsé', 'divorcé', 'séparé', 'célibataire', 'veuf', 'mariage', 'divorce','marier','divorcer'])
}, 
{
    name: 'information_medicale',
    faker: _.sample(['endométriose',
    'fibromyalgie',
    'mononucléose',
    'psoriasis',
    'scarlatine',
    'hémorroïdes',
    'schizophrénie',
    'zona',
    'appendicite',
    'burn-out',
    'rougeole',
    'varicelle',
    'gale',
    'chlamydia',
    'diarrhée',
    'lupus',
    'orgelet',
    'phlébite',
    'sciatique',
    'méningite',
    'dépression',
    'avc',
    'acouphènes',
    'anémie',
    'arthrose',
    'autisme',
    'conjonctivite',
    'cystite',
    'diabète',
    'eczéma',
    'grippe',
    'hypothyroïdie',
    'lumbago',
    'papillomavirus',
    'roséole',
    'syphilis',
    'pancréatite',
    'impétigo',
    'algodystrophie',
    'angine',
    'constipation',
    'cruralgie',
    'hyperthyroïdie',
    'pneumopathie',
    'sinusite',
    'tachycardie',
    'tuberculose',
    'urticaire',
    'cholestérol',
    'herpès',
    'ait',
    'bronchite',
    'cancer',
    'chalazion',
    'coqueluche',
    'drépanocytose',
    'erysipèle',
    'escarre',
    'furoncle',
    'glaucome',
    'infarctus',
    'leucémie',
    'mucoviscidose',
    'pneumonie',
    'pneumothorax',
    'rhinopharyngite',
    'septicémie',
    'sida',
    'tendinite',
    'toxoplasmose',
    'vitiligo',
    'ostéoporose',
    'trachéite',
    'bpco',
    'cataracte',
    'fibrome',
    'hypertension',
    'laryngite',
    'lombalgie',
    'mycose',
    'paludisme',
    'phimosis',
    'polyarthrite',
    'polype',
    'purpura',
    'ulcère'])
}, 
{
    name: 'orientation_sexuelle',
    faker: _.sample(['hétérosexualité', 'homosexualité','bisexualité', 'asexualité','hétérosexuel','homosexuel','bisexuel','asexuel','hétérosexual','homosexual','bisexual','asexual'])
}, 
{
    name: 'information_religieuse',
    faker: _.sample(['Jaïnisme','Hindouisme','Bouddhisme','Zoroastrisme','taoïsme','Judaïsme','Confucianisme','Mithraïsme','Christianisme','Mandéisme','Manichéisme','Elkasaïsme','Islam','hindou','chrétien','juif','juive','bouddhiste','musulman'])
}];

module.exports = {
    post: async (req, res) => {
        console.log(req.body);
        let output = "";
        const msg = {
            id: v4(),
            from: req.body.from,
            type: req.body.type,
            content: {clear: req.body.content}
        }
   
        const pythonProcess = spawn('python', [
            './model/executable.py',
            msg.content.clear,
        ], {detached: true,
            maxBuffer: 10 * 1024 * 1024 * 1024});

        pythonProcess.stdout.on('data', (data) => {
            console.log(data.toString())
            output += data.toString();
        });


        pythonProcess.on('exit', (data) => { 
            const pythonResponse = JSON.parse(/\$FinaleResult-(.*?)\$/g.exec(output)[1].split("'").join('"').replace("True", "true").replace("False", "false"));

            msg.toHide = pythonResponse.toHide;

            msg.content.hidden = msg.content.clear;
            msg.content.fake = msg.content.clear;

            const allMatches = [].concat.apply([], tags.map(tag => pythonResponse[tag.name]))
            
             allMatches.forEach(match => {
                const other = _.filter(allMatches, m => m != match);
                if (other.join(" ").includes(match)) {
                    tags.forEach(tag => {
                        pythonResponse[tag.name] = _.filter(pythonResponse[tag.name], m => m != match)
                    });
                }
             });

            tags.forEach(tag => {
                msg[tag.name] = pythonResponse[tag.name]

                msg[tag.name].forEach(el => {
                    msg.content.hidden = msg.content.hidden.replace(el, `*${tag.name}*`);
                    msg.content.fake = msg.content.fake.replace(el, `*${tag.faker}*`);
                });
            });

            console.log(msg)
            messages.push(msg);

            fs.writeFile('./data/messages.json', JSON.stringify(messages), function writeJSON(err) {
                if (err) return console.log(err);
                console.log('writing to JSON file');
            });
    
            res.status(200).json({
                status: 'success',
                msg,
            });
        });

        pythonProcess.stderr.on('data', (data) => {
            console.error(data.toString());
        });
    },
    get: async (req, res, next) => {
    console.log(messages);
    
    res.status(200).json({
        status: 'success',
        messages,
    });
    }
}

