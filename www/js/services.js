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
})

.service('EstacionamentoService', function($http, ESTACIONAR_CONFIG) {
  
  this.listarEstacionamentosPorIdUsuario = function(id_usuario) {
    return $http.get(ESTACIONAR_CONFIG.SERVIDOR + "/estacionamentos/" + id_usuario);
  }

  this.listarValoresEstacionamentoPorId = function(id) {
    return $http.get(ESTACIONAR_CONFIG.SERVIDOR + "/estacionamentos/" + id + "/valores");
  }

  this.salvarEstacionamento = function(estacionamento) {
    return $http.post(ESTACIONAR_CONFIG.SERVIDOR + "/estacionamentos", estacionamento);
  }
});
