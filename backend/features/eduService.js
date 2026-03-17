const fs = require('fs');
const path = require('path');

const getEduContent = () => {
    try {
        const filePath = path.join(__dirname, '../data/eduContent.json');
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading edu content:', error);
        return {
            wasteCategories: [],
            dailyGuides: []
        };
    }
};

module.exports = {
    getEduContent
};
