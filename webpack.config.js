const path = require('path');

module.exports = {
  watchOptions: {
    ignored: [
      '**/node_modules/**',
      '**/build/**',
      '**/dist/**',
      '**/.git/**',
      '**/C:/pagefile.sys',
      '**/C:/hiberfil.sys',
      '**/C:/swapfile.sys',
      '**/C:/System Volume Information/**',
      '**/C:/$Recycle.Bin/**',
      '**/C:/Windows/**',
      '**/C:/Program Files/**',
      '**/C:/Program Files (x86)/**',
      '**/C:/Users/**/AppData/**',
      '**/C:/Users/**/Local Settings/**',
      '**/C:/Users/**/NTUSER.DAT*',
      '**/C:/Users/**/ntuser.dat*',
      '**/C:/Users/**/UsrClass.dat*',
      '**/C:/Users/**/usrclass.dat*'
    ],
    poll: false
  }
}; 