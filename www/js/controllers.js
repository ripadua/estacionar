angular.module('starter.controllers', [])

.controller('TabsCtrl', function($rootScope, $scope, $localStorage, $state, $ionicPopup, $ionicLoading, EstacionamentoService) {

  $scope.estacionamentoSelecionado = {};

  $ionicLoading.show({});

  EstacionamentoService.listarEstacionamentosPorIdUsuario($localStorage.usuario.id).then(function(response){
    $ionicLoading.hide();

    if (response.data.length > 1) {

      $scope.listaEstacionamentos = response.data;

      var confirmPopup = $ionicPopup.show({
        title: 'Estacionar',
        subTitle: 'Selecione o estacionamento:',
        templateUrl: './templates/template-selecao-estacionamento.html',
        scope: $scope,
        buttons: [{
            text:'Confirmar',
            type: 'button-positive',
            onTap: function(e) {
              if (!$scope.estacionamentoSelecionado.id) {
                e.preventDefault();
                $ionicPopup.alert({
                  title: 'Estacionar',
                  cssClass: 'text-center',
                  template: 'Selecione o estacionamento para continuar.'
                });
              } else {
                consultarValores($scope.estacionamentoSelecionado);

              }
            }
          }
        ]
      });

    } else if (response.data.length == 1) {
      consultarValores(response.data[0]);

    } else {

      $localStorage.estacionamento = {};
      $rootScope.estacionamento = {};

      var popup = $ionicPopup.alert({
        title: 'Estacionar',
        cssClass: 'text-center',
        template: 'Bem vindo ao Estacionar. Para utilizar o app é necessário configurar os dados do seu estacionamento.'
      });

      popup.then(function(res){
        $state.go('tab.configuracoes');
      });
    }
  }, function(erro){
    var popup = $ionicPopup.alert({
      title: 'Estacionar',
      cssClass: 'text-center',
      template: 'Bem vindo ao Estacionar. Para utilizar o app é necessário configurar os dados do seu estacionamento.'
    });

    popup.then(function(res){
      $state.go('tab.configuracoes');
    });
  });

  if (!$localStorage.entradas) {
    $localStorage.entradas = [];
  }

  if (!$localStorage.despesas) {
    $localStorage.despesas = [];
  }

  $scope.alterarSelecaoEstacionamento = function(estacionamentoSelecionado) {
    $scope.estacionamentoSelecionado = estacionamentoSelecionado;
  }

  function consultarValores(estacionamento) {
    $rootScope.estacionamento = estacionamento;
    EstacionamentoService.listarValoresEstacionamentoPorId($rootScope.estacionamento.id).then(function(response){
      $rootScope.estacionamento.estacionamentoValores = [];
      for (var x in response.data) {
          $rootScope.estacionamento.estacionamentoValores.push(response.data[x]);
      }
      $localStorage.estacionamento = $rootScope.estacionamento;
    });
      
    $rootScope.vagas_ocupadas = $localStorage.entradas.filter(function(value){ return value && !value.datahora_saida}).length;
  }
})

.controller('InicioCtrl', function($scope, $rootScope, $localStorage, $state, $cordovaBarcodeScanner, $ionicPopup) {

  $scope.saida = {};

  $scope.$on('$stateChangeSuccess', 
    function(event, toState, toParams, fromState, fromParams){ 
      if (toState.name == 'tab.inicio') {
        if ($rootScope.estacionamento) {
          $rootScope.vagas_ocupadas = $localStorage.entradas.filter(function(value){ return value && !value.datahora_saida}).length;
        }
      }
    }
  );

  $scope.registrarEntrada = function() {
    $state.go('tab.entrada');
  }

  function registrarSaida(entrada, multa) {
    var dataHoraSaida = new Date();
    var diferencaMinutos = Math.abs(dataHoraSaida - new Date(entrada.datahora_entrada))/1000/60;
    diferencaMinutos = Math.round(diferencaMinutos);
    
    var totalAPagar = 0;
    var estacionamentoValor = $localStorage.estacionamento.estacionamentoValores.filter(function(value){return value.id_tipo_veiculo == entrada.veiculo})[0];
    var valor_primeira_hora = estacionamentoValor.valor_primeira_hora;
    var valor_hora_adicional = estacionamentoValor.valor_hora_adicional;

    if ($localStorage.estacionamento.tolerancia) {
      if (diferencaMinutos > $localStorage.estacionamento.tolerancia) {
        totalAPagar += valor_primeira_hora;

        if (multa) {
          totalAPagar += $localStorage.estacionamento.multa_perda_cartao;
        }

        if (diferencaMinutos > 60) {
          if ($localStorage.estacionamento.cobrar_horas_quebradas) {
            totalAPagar += ((diferencaMinutos/60) - 1) * valor_hora_adicional;
          } else {
            totalAPagar += (Math.ceil(diferencaMinutos/60) - 1) * valor_hora_adicional;
          }
        }
      }
    } else {
      totalAPagar += valor_primeira_hora;

      if (multa) {
        totalAPagar += $localStorage.estacionamento.multa_perda_cartao;
      }

      if (diferencaMinutos > 60) {
        if ($localStorage.estacionamento.cobrar_horas_quebradas) {
          totalAPagar += ((diferencaMinutos/60) - 1) * valor_hora_adicional;
        } else {
          totalAPagar += (Math.ceil(diferencaMinutos/60) - 1) * valor_hora_adicional;
        }
      }
    }

    var pad = "00";
    var strHoras = Math.floor(diferencaMinutos/60) + "";
    var horas = pad.substring(0, pad.length - strHoras.length) + strHoras;
    var strMinutos = (diferencaMinutos%60) + "";
    var minutos = pad.substring(0, pad.length - strMinutos.length) + strMinutos;

    entrada.total_tempo_formatado = horas + ":" + minutos;
    entrada.datahora_saida = dataHoraSaida;
    entrada.total_tempo = diferencaMinutos;
    entrada.valor_pago = totalAPagar;
    entrada.total_pagar = totalAPagar;

    $scope.saida = entrada;

    var confirmPopup = $ionicPopup.show({
      title: 'Estacionar',
      subTitle: 'Confirmar saída?',
      templateUrl: './templates/tab-final.html',
      scope: $scope,
      buttons: [{
        text: 'Não',
        type: 'button-default',
        onTap: function(e) {
            entrada.datahora_saida = undefined;
            entrada.total_tempo = undefined;
            entrada.total_pagar = undefined;
            $scope.saida = undefined;
          }
        }, {
          text:'Sim',
          type: 'button-positive',
          onTap: function(e) {
            var popup = $ionicPopup.alert({
              title: 'Estacionar',
              cssClass: 'text-center',
              template: 'Saída realizada com sucesso.'
            });

            popup.then(function(res){
              $rootScope.vagas_ocupadas = $localStorage.entradas.filter(function(value){ return value && !value.datahora_saida}).length;
            });
          }
        }
      ]
    });
  }

  $scope.registrarSaidaCartao = function() {

    $cordovaBarcodeScanner.scan().then(function(imageData){
      var dadosQrCode = JSON.parse(imageData.text);
      //var dadosQrCode = {"sistema":"estacionar","cartao":"1"};
      if (dadosQrCode.sistema == 'estacionar') {
        var entrada = $localStorage.entradas.filter(function(value){return value.cartao == dadosQrCode.cartao && !value.datahora_saida});

        if (entrada.length > 0) {
          registrarSaida(entrada[0], false);

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

  $scope.registrarSaidaPlaca = function() {

    $scope.entrada = undefined;
    $scope.entradas = $localStorage.entradas.filter(function(value){ return value && !value.datahora_saida});

    var confirmPopup = $ionicPopup.show({
      title: 'Estacionar',
      subTitle: 'Selecione a placa do veículo:',
      templateUrl: './templates/template-perdeu-cartao.html',
      scope: $scope,
      buttons: [{
        text: 'Cancelar',
        type: 'button-default',
        onTap: function(e) {
          }
        }, {
          text:'Confirmar',
          type: 'button-positive',
          onTap: function(e) {
            if (!$scope.entrada) {
              e.preventDefault();
              $ionicPopup.alert({
                title: 'Estacionar',
                cssClass: 'text-center',
                template: 'Selecione a placa do veículo para realizar a saída.'
              });
            } else {
              registrarSaida($scope.entrada, true);
            }
          }
        }
      ]
    });
  }

  $scope.alterarSelecaoPlaca = function(entradaSelecionada) {
    $scope.entrada = entradaSelecionada;
  }
})

.controller('EntradaCtrl', function($scope, $localStorage, $cordovaBarcodeScanner, $ionicPopup, $ionicLoading, $state) {
  
  function validarTiposVeiculos() {
    $scope.tiposVeiculos = $localStorage.estacionamento.estacionamentoValores.filter(function(value){return value.valor_primeira_hora && value.valor_primeira_hora > 0});

    if ($scope.tiposVeiculos.length == 0) {
      var popup = $ionicPopup.alert({
        title: 'Estacionar',
        cssClass: 'text-center',
        template: 'É necessário configurar os valores de cobrança para os tipos de veículos para realizar uma entrada.'
      });

      popup.then(function(res){
        $state.go('tab.configuracoes');
      });
    } else {
      $scope.container = {
        veiculo: $scope.tiposVeiculos[0].id_tipo_veiculo,
        placa: null,
        datahora_entrada: new Date()
      };
      $scope.placa = {};
    }
  }

  //validarTiposVeiculos();
  
  $scope.$on('$stateChangeSuccess', 
    function(event, toState, toParams, fromState, fromParams){ 
      if (toState.name == 'tab.entrada') {
        validarTiposVeiculos();
        
      }
    }
  );

  $scope.lerCartao = function() {
    if (!$scope.container.veiculo) {
      $ionicPopup.alert({
        title: 'Estacionar',
        cssClass: 'text-center',
        template: 'Informe o tipo de veículo. Caso não estejam aparecendo as opções, será necessário definir os valores de cobrança na tela de configurações.'
      });
      return;
    }

    $scope.container.placa = "";
    for(var i = 1; i <= 7; i++) {
      if ($scope.placa['placa_'+i]) {
        $scope.container.placa += $scope.placa['placa_'+i];
      }
    }
    $scope.container.placa = $scope.container.placa.toUpperCase();

    if ($scope.container.placa.length < 7) {
      $ionicPopup.alert({
        title: 'Estacionar',
        cssClass: 'text-center',
        template: 'Informe a placa do veículo completa para ler o código.'
      });
      return;
    }

    $cordovaBarcodeScanner.scan().then(function(imageData){
      var dadosQrCode = JSON.parse(imageData.text);
      //var dadosQrCode = {"sistema":"estacionar","cartao":"1"};
      if (dadosQrCode.sistema == 'estacionar') {
        $scope.container.cartao = dadosQrCode.cartao;

        var entrada = $localStorage.entradas.filter(function(value){return value.cartao == dadosQrCode.cartao && !value.datahora_saida});

        if (entrada.length > 0) {
          $ionicPopup.alert({
            title: 'Estacionar',
            cssClass: 'text-center',
            template: 'O QR code do cartão lido já está em uso. Por favor utilize outro cartão.'
          });
          return;
        }

        var date = new Date();
        $scope.container.datahora_entrada = date;

        $localStorage.entradas.push($scope.container);

        var dataHoraFormatada = date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear() + ' ' + date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();

        var popup = $ionicPopup.alert({
          title: 'Estacionar',
          cssClass: 'text-center',
          template: 'Entrada registrada com sucesso. Placa: ' + $scope.container.placa + ' - Data/Hora: ' + dataHoraFormatada
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
  
})

.controller('DespesaCtrl', function($scope, $cordovaBarcodeScanner, $localStorage, $ionicPopup, $ionicLoading, $state) {

  $scope.container = {
    data: new Date()
  }

  $scope.$on('$stateChangeSuccess', 
    function(event, toState, toParams, fromState, fromParams){ 
      if (toState.name == 'tab.despesa') {
        $scope.container = {
          data: new Date()
        }
      }
    } 
  );

  $scope.salvar = function() {

    //Executa o loading
    $ionicLoading.show({});

    if (!$scope.container.descricao) {
      $ionicPopup.alert({
        title: 'Estacionar',
        cssClass: 'text-center',
        template: 'Informe a descrição da despesa.'
      });
      $ionicLoading.hide();
      return;
    }

    if (!$scope.container.valor) {
      $ionicPopup.alert({
        title: 'Estacionar',
        cssClass: 'text-center',
        template: 'Informe o valor da despesa.'
      });
      $ionicLoading.hide();
      return;
    }

    $localStorage.despesas.push($scope.container);

    $ionicPopup.alert({
      title: 'Estacionar',
      cssClass: 'text-center',
      template: 'Despesa registrada com sucesso.'
    });
    
    $scope.container = {
      data: new Date()
    }

    //Finaliza o loading
    $ionicLoading.hide();
  }

})

.controller('CaixaCtrl', function($scope, $localStorage) {
  
  $scope.data = new Date();
  $scope.data.setHours(0,0,0,0);
 
  calcularTotais();

  $scope.$on('$stateChangeSuccess', 
    function(event, toState, toParams, fromState, fromParams){ 
      if (toState.name == 'tab.caixa') {
        

        calcularTotais();
      }
    }
  );

  function calcularTotais() {
    $scope.receitas = [];
    $scope.despesas = [];
    $scope.receitas = $localStorage.entradas.filter(function(value){
      var dataSaida = new Date(value.datahora_saida);
      return value 
          && value.datahora_saida 
          && dataSaida.getDate() == $scope.data.getDate()
          && dataSaida.getMonth() == $scope.data.getMonth()
          && dataSaida.getFullYear() == $scope.data.getFullYear();
    });
    $scope.despesas = $localStorage.despesas.filter(function(value){
      var dataDespesa = new Date(value.data);
      return value
          && value.data
          && dataDespesa.getDate() == $scope.data.getDate()
          && dataDespesa.getMonth() == $scope.data.getMonth()
          && dataDespesa.getFullYear() == $scope.data.getFullYear();
    });

    $scope.total_receitas = 0;
    $scope.total_despesas = 0;


    for(r in $scope.receitas) {
      $scope.total_receitas += $scope.receitas[r].total_pagar;
    }

    for(d in $scope.despesas) {
      $scope.total_despesas += $scope.despesas[d].valor;
    }

    $scope.total = $scope.total_receitas - $scope.total_despesas;
  }

  $scope.navegarDataAnterior = function() {
    $scope.data.setDate($scope.data.getDate()-1);
    calcularTotais();
  }

  $scope.navegarDataProxima = function() {
    $scope.data.setDate($scope.data.getDate()+1);
    calcularTotais();
  }

  $scope.mostrarDataProxima = function() {
    var dataAtual = new Date();
    return $scope.data.getDate() < dataAtual.getDate()
        && $scope.data.getMonth() <= dataAtual.getMonth()
        && $scope.data.getFullYear() <= dataAtual.getFullYear();
  }

  $scope.toggleGroup = function(group) {
    if ($scope.isGroupShown(group)) {
      $scope.shownGroup = null;
    } else {
      $scope.shownGroup = group;
    }
  };
  $scope.isGroupShown = function(group) {
    return $scope.shownGroup === group;
  };

})

.controller('ConfiguracoesCtrl', function($scope, $localStorage, $ionicPopup, $ionicLoading, $state, $rootScope, EstacionamentoService, TipoVeiculoService) {
  
  $scope.usuario = $localStorage.usuario || {};
  $scope.container = $localStorage.estacionamento || {};

  if (!$scope.container.estacionamentoValores || $scope.container.estacionamentoValores.length == 0) {
    $scope.container.estacionamentoValores = [];
    TipoVeiculoService.listarTiposVeiculos().then(function(response){
      for (var x in response.data) {
        $scope.container.estacionamentoValores.push({
          id_tipo_veiculo: response.data[x].id,
          descricao: response.data[x].descricao
        });
      }
    })
  }

  $scope.salvar = function() {
    
    //Executa o loading
    $ionicLoading.show({});
    $scope.container.id_usuario = $localStorage.usuario.id;

    var data = {
      estacionamento: $scope.container
    }

    EstacionamentoService.salvarEstacionamento(data).then(function(response){

      if(response.data.insertId) {
        $scope.container.id = response.data.insertId;
      }

      $localStorage.estacionamento = $scope.container;
      $rootScope.estacionamento = $scope.container;

      $ionicPopup.alert({
        title: 'Estacionar',
        cssClass: 'text-center',
        template: 'Configurações salvas com sucesso.'
      });
      
      //Finaliza o loading
      $ionicLoading.hide();
      
    }, function(erro){
      console.log(erro);
      $ionicLoading.hide();

      $ionicPopup.alert({
        title: 'Estacionar',
        cssClass: 'text-center',
        template: 'Ocorreu um erro ao salvar as configurações. Por favor tente novamente.'
      });
    });
  }

})

.controller('LoginCtrl', function($scope, $localStorage, $ionicPopup, $ionicLoading, $state, $rootScope, UsuarioService, ESTACIONAR_CONFIG) {

  $scope.data = {};

  $scope.versao = ESTACIONAR_CONFIG.VERSAO_APLICACAO;

  if($localStorage.usuario) {
    $state.go('tab.inicio');
  }

  $scope.entrar = function() {
    
    //Executa o loading
    $ionicLoading.show({});

    if (!$scope.data.login) {
      $ionicPopup.alert({
        title: 'Estacionar',
        cssClass: 'text-center',
        template: 'Informe o login para entrar no Estacionar.'
      });
      $ionicLoading.hide();
      return;
    }

    if (!$scope.data.senha) {
      $ionicPopup.alert({
        title: 'Estacionar',
        cssClass: 'text-center',
        template: 'Informe a senha para entrar no Estacionar.'
      });
      $ionicLoading.hide();
      return;
    }

    UsuarioService.autenticarUsuario($scope.data).then(function(response){
      
      $localStorage.usuario = response.data;

      $ionicLoading.hide();
      $state.go('tab.inicio');

    }, function(erro){
      if (erro.status == 401) {
        $ionicPopup.alert({
          title: 'Estacionar',
          cssClass: 'text-center',
          template: 'Login ou senha inválidos. Verifique os dados informados e tente novamente.'
        });
      } else if (erro.status == 402) {
        $ionicPopup.alert({
          title: 'Estacionar',
          cssClass: 'text-center',
          template: 'Pagamento pendente. Por favor entre em contato com o administrador do sistema.'
        });
      } else {
        $ionicPopup.alert({
          title: 'Estacionar',
          cssClass: 'text-center',
          template: 'Ocorreu um erro ao entrar no sistema. Por favor tente novamente.'
        });
      }
      console.log(erro);
      $ionicLoading.hide();
    });

  }

})

.controller('AjudaCtrl', function($scope, $localStorage, $ionicPopup, $ionicLoading, $state, $rootScope, UsuarioService, ESTACIONAR_CONFIG) {

});
