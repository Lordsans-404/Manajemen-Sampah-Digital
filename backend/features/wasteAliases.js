/**
 * @fileoverview Mapping alias input user ke kategori sampah
 * Hkalau mau tambahin sung aja 
 */

const WASTE_ALIASES = {
    // plastik
    'botol':            'plastik',
    'botol plastik':    'plastik',
    'kantong':          'plastik',
    'kresek':           'plastik',
    'sedotan':          'plastik',
    'ember':            'plastik',
    'gayung':           'plastik',
    'toples':           'plastik',

    // kertas
    'kardus':           'kertas',
    'karton':           'kertas',
    'koran':            'kertas',
    'majalah':          'kertas',
    'buku':             'kertas',
    'dus':              'kertas',
    'amplop':           'kertas',
    'tisu':             'kertas',

    // kaca
    'botol kaca':       'kaca',
    'cermin':           'kaca',
    'gelas kaca':       'kaca',
    'toples kaca':      'kaca',

    // logam
    'besi':             'logam',
    'kaleng':           'logam',
    'aluminium':        'logam',
    'tembaga':          'logam',
    'baja':             'logam',
    'paku':             'logam',
    'kawat':            'logam',
    'wajan':            'logam',

    // elektronik
    'batre':            'elektronik',
    'baterai':          'elektronik',
    'hp':               'elektronik',
    'handphone':        'elektronik',
    'ponsel':           'elektronik',
    'charger':          'elektronik',
    'kabel':            'elektronik',
    'laptop':           'elektronik',
    'komputer':         'elektronik',
    'tv':               'elektronik',
    'televisi':         'elektronik',
    'remote':           'elektronik',
    'kipas':            'elektronik',
};

module.exports = { WASTE_ALIASES };