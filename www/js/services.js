angular.module('starter.services', [])

.service('UsuarioService', function($http, ESTACIONAR_CONFIG) {
  
  this.autenticarUsuario = function(data) {
    var senhaEncriptada = CryptoJS.SHA256(data.senha).toString();
    var usuario = {
    	usuario: {
    		login: data.login,
    		senha: senhaEncriptada
    	}
    }
    return $http.post(ESTACIONAR_CONFIG.SERVIDOR + "/usuarios/autenticarUsuario", usuario);
  }
});
