angular.module('starter.services', [])

.service('UsuarioService', function($http, ESTACIONAR_CONFIG) {
  
  this.autenticarUsuario = function(data) {
    var senhaEncriptada = CryptoJS.SHA256(data.senha).toString();
    return $http.get(ESTACIONAR_CONFIG.servidor + "/autenticarUsuario?usuario=" + data.usuario + "&senha=" + senhaEncriptada);
  }
});
