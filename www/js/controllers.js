angular.module('starter.controllers', [])

.controller('TabsCtrl', function($rootScope, $scope, $localStorage, $state, $ionicPopup) {

  if (!$localStorage.estacionamento) {
    var popup = $ionicPopup.alert({
      title: 'Estacionar',
      cssClass: 'text-center',
      template: 'Bem vindo ao Estacionar. Para utilizar o app é necessário configurar os dados do seu estacionamento.'
    });

    popup.then(function(res){
      $state.go('tab.configuracoes');
    });
  } else {
    if (!$localStorage.entradas) {
      $localStorage.entradas = [];
    }

    $rootScope.estacionamento = $localStorage.estacionamento;
    $rootScope.estacionamento.vagas_ocupadas = $localStorage.entradas.filter(function(value){ return value && !value.datahora_saida}).length;
  }
})

.controller('InicioCtrl', function($scope, $rootScope, $localStorage, $state) {

  $scope.$on('$stateChangeSuccess', 
    function(event, toState, toParams, fromState, fromParams){ 
      if (toState.name == 'tab.inicio') {
        if ($rootScope.estacionamento) {
          $rootScope.estacionamento.vagas_ocupadas = $localStorage.entradas.filter(function(value){ return value && !value.datahora_saida}).length;
        }
      }
    }
  );

  $scope.registrarEntrada = function() {
    $state.go('tab.entrada');
  }

  $scope.registrarSaida = function() {
    $state.go('tab.saida');
  }
})

.controller('EntradaCtrl', function($scope, $localStorage, $cordovaBarcodeScanner, $ionicPopup, $ionicLoading, $state) {
  
  $scope.container = {};
  $scope.letra_1 = "";
  $scope.numero_1 = "";
  $scope.letras = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'];
  $scope.numeros = [0,1,2,3,4,5,6,7,8,9];

  $scope.$on('$stateChangeSuccess', 
    function(event, toState, toParams, fromState, fromParams){ 
      if (toState.name == 'tab.entrada') {
        $scope.container = {
          cartao: null,
          placa: null,
          datahora_entrada: new Date()
        }
      }
    }
  );

  $scope.lerCartao = function() {
    $cordovaBarcodeScanner.scan().then(function(imageData){
      var dadosQrCode = JSON.parse(imageData.text);
      if (dadosQrCode.sistema == 'estacionar') {
        $scope.container.cartao = dadosQrCode.cartao;
        $scope.container.datahora_entrada = new Date();

        $localStorage.entradas.push($scope.container);

        var popup = $ionicPopup.alert({
          title: 'Estacionar',
          cssClass: 'text-center',
          template: 'Entrada registrada com sucesso. Placa: ' + $scope.container.placa + ' - Data/Hora: ' + $scope.container.datahora_entrada
        });
        
        popup.then(function(res){
          $state.go('tab.inicio');
        });
      } else {
        $ionicPopup.alert({
          title: 'Estacionar',
          cssClass: 'text-center',
          template: 'O QR code lido não é um código válido para o Estacionar. Por favor leia o cartão disponibilizado ou entre em contato com o suporte técnico.'
        });
      }
    });
  }

  $scope.salvar = function() {

    //Executa o loading
    $ionicLoading.show({});

    $localStorage.entradas.push($scope.container);

    var popup = $ionicPopup.alert({
      title: 'Estacionar',
      cssClass: 'text-center',
      template: 'Entrada registrada com sucesso.'
    });
    
    //Finaliza o loading
    $ionicLoading.hide();

    popup.then(function(res){
      $state.go('tab.inicio');
    });
  }

})

.controller('SaidaCtrl', function($scope, $cordovaBarcodeScanner, $localStorage, $ionicPopup, $ionicLoading, $state) {
  
  $scope.$on('$stateChangeSuccess', 
    function(event, toState, toParams, fromState, fromParams){ 
      if (toState.name == 'tab.saida') {
        $scope.entrada = null;
      }
    }
  );

  $scope.lerCartao = function() {
    $cordovaBarcodeScanner.scan().then(function(imageData){
      var dadosQrCode = JSON.parse(imageData.text);
      if (dadosQrCode.sistema == 'estacionar') {
        var entrada = $localStorage.entradas.filter(function(value){return value.cartao == dadosQrCode.cartao && !value.datahora_saida});

        if (entrada.length > 0) {
          $scope.entrada = entrada[0];
          $scope.entrada.datahora_saida = new Date();
          var diferencaMinutos = Math.abs($scope.entrada.datahora_saida - $scope.entrada.datahora_entrada)/1000/60;
          $scope.entrada.total_tempo = diferencaMinutos;
          var totalAPagar = $localStorage.estacionamento.valor_primeira_hora;
          if (diferencaMinutos > 60) {
            totalAPagar += (diferencaMinutos/60) * $localStorage.estacionamento.valor_hora_adicional;
          }
          $scope.entrada.total_pagar = totalAPagar;

        } else {
          $ionicPopup.alert({
            title: 'Estacionar',
            cssClass: 'text-center',
            template: 'Não foi realizada entrada do cartão lido. Por favor ler o cartão que foi entregue ao cliente.'
          });
        }
      } else {
        $ionicPopup.alert({
          title: 'Estacionar',
          cssClass: 'text-center',
          template: 'O QR code lido não é um código válido para o Estacionar. Por favor leia o cartão disponibilizado ou entre em contato com o suporte técnico.'
        });
      }
    });
  }

  $scope.salvar = function() {

    //Executa o loading
    $ionicLoading.show({});

    $localStorage.entradas.push($scope.entrada);

    var popup = $ionicPopup.alert({
      title: 'Estacionar',
      cssClass: 'text-center',
      template: 'Saída registrada com sucesso.'
    });
    
    //Finaliza o loading
    $ionicLoading.hide();

    popup.then(function(res){
      $state.go('tab.inicio');
    });
  }

})

.controller('RelatorioCtrl', function($scope, $localStorage) {
  
  $scope.$on('$stateChangeSuccess', 
    function(event, toState, toParams, fromState, fromParams){ 
      if (toState.name == 'tab.relatorio') {
        $scope.entradas = $localStorage.entradas.filter(function(value){return value && value.datahora_saida});
      }
    }
  );

})

.controller('ConfiguracoesCtrl', function($scope, $localStorage, $ionicPopup, $ionicLoading, $state, $rootScope) {
  
  $scope.usuario = $localStorage.usuario || {};
  $scope.container = $localStorage.estacionamento || {};

  $scope.salvar = function() {
    
    //Executa o loading
    $ionicLoading.show({});

    $localStorage.estacionamento = $scope.container;
    $rootScope.estacionamento = $scope.container;
    $localStorage.entradas = [];

    var popup = $ionicPopup.alert({
      title: 'Estacionar',
      cssClass: 'text-center',
      template: 'Configurações salvas com sucesso. Agora você pode registrar entradas e saídas de carros. Em caso de dúvidas ou sugestões, entre em contato com o suporte técnico.'
    });
    
    //Finaliza o loading
    $ionicLoading.hide();

    popup.then(function(res){
      $state.go('tab.inicio');
    });
  }

});
