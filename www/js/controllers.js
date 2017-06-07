angular.module('starter.controllers', [])

.controller('TabsCtrl', function($rootScope, $scope, $localStorage, $state, $ionicPopup, $ionicLoading, EstacionamentoService) {

  $scope.estacionamentoSelecionado = {};

  if ($localStorage.estacionamento && $localStorage.estacionamento.sincronizar) {
    $scope.estacionamento = $localStorage.estacionamento;
  } else {

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
      $ionicLoading.hide();

      if ($localStorage.estacionamento) {
        $scope.estacionamento = $localStorage.estacionamento;
      } else {
        var popup = $ionicPopup.alert({
          title: 'Estacionar',
          cssClass: 'text-center',
          template: 'Bem vindo ao Estacionar. Para configurar o aplicativo pela primeira vez é necessário ter uma conexão ativa. Por favor habilite sua conexão e realize o login novamente.'
        });

        popup.then(function(res){
          $localStorage.usuario = undefined;
          $state.go('login');
        });
      }
    });
  }

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
    $scope.estacionamento = estacionamento;
    EstacionamentoService.listarValoresEstacionamentoPorId($scope.estacionamento.id).then(function(response){
      $scope.estacionamento.estacionamentoValores = [];
      for (var x in response.data) {
          $scope.estacionamento.estacionamentoValores.push(response.data[x]);
      }
      $localStorage.estacionamento = $scope.estacionamento;
    }, function(erro){
      $localStorage.estacionamento = $scope.estacionamento;
    });
    
    EstacionamentoService.listarEntradasPorId($scope.estacionamento.id).then(function(response){
      for(var x in response.data) {
        var naoExiste = $localStorage.entradas.filter(function(value){ return value.id == response.data[x].id}).length == 0;
        if (naoExiste) {
          $localStorage.entradas.push(response.data[x]);
        }
      }
      $rootScope.vagas_ocupadas = $localStorage.entradas.filter(function(value){ return value && !value.datahora_saida}).length;
    });

    EstacionamentoService.listarDespesasPorId($scope.estacionamento.id).then(function(response){
      for(var x in response.data) {
        var naoExiste = $localStorage.despesas.filter(function(value){ return value.id == response.data[x].id}).length == 0;
        if (naoExiste) {
          $localStorage.despesas.push(response.data[x]);
        }
      }
    });
  }

  $scope.$on('atualizar-estacionamento', function(event){
    $scope.estacionamento = $localStorage.estacionamento;
  });
})

.controller('InicioCtrl', function($scope, $rootScope, $localStorage, $state, $cordovaBarcodeScanner, $ionicPopup, $ionicLoading, EntradaService, EstacionamentoService, DespesaService) {

  $scope.saida = {};

  $rootScope.vagas_ocupadas = $localStorage.entradas.filter(function(value){ return value && !value.datahora_saida}).length;

  $scope.$on('$stateChangeSuccess', 
    function(event, toState, toParams, fromState, fromParams){ 
      if (toState.name == 'tab.inicio') {
        if ($localStorage.estacionamento) {
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
    var estacionamentoValor = $localStorage.estacionamento.estacionamentoValores.filter(function(value){return value.id_tipo_veiculo == entrada.id_tipo_veiculo})[0];
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

            $scope.$broadcast('salvar-saida', $scope.saida);
          }
        }
      ]
    });
  }

  $scope.$on('salvar-saida', function(event, saida){
    EntradaService.salvar(saida).then(function(response){
      var index = $localStorage.entradas.indexOf(saida);
      $localStorage.entradas[index] = response.data;
      $rootScope.vagas_ocupadas = $localStorage.entradas.filter(function(value){ return value && !value.datahora_saida}).length;
    }, function(erro){
      saida.sincronizar = true;
      var index = $localStorage.entradas.indexOf(saida);
      $localStorage.entradas[index] = saida;
      $rootScope.vagas_ocupadas = $localStorage.entradas.filter(function(value){ return value && !value.datahora_saida}).length;
      console.log(erro);
    });
  });

  $scope.registrarSaidaCartao = function() {

    $cordovaBarcodeScanner.scan().then(function(imageData){

      if (imageData.cancelled) {
        return;
      }
      
      var dadosQrCode = JSON.parse(imageData.text);
      //var dadosQrCode = {"sistema":"estacionar","cartao":"4"};
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

  $scope.possuiItensSincronizar = function() {
    var possui = false;

    if ($localStorage.estacionamento.sincronizar) {
      possui = true;
    }

    if ($localStorage.entradas.filter(function(value){return value.sincronizar}).length > 0) {
      possui = true;
    }

    if ($localStorage.despesas.filter(function(value){return value.sincronizar}).length > 0) {
      possui = true;
    }

    if(possui) {
      return 'assertive';
    }  
  }

  $scope.sincronizar = function() {
    $ionicLoading.show({
      template: 'Sincronizando...'
    });

    $scope.sincronizar = {
      configuracoes: false,
      entradas: false,
      saidas: false,
      despesas: false
    }

    $scope.configuracoesSincronizadas = false;

    if ($localStorage.estacionamento.sincronizar) {
      delete $localStorage.estacionamento.sincronizar;
      EstacionamentoService.salvar($localStorage.estacionamento).then(function(response){
        $localStorage.estacionamento = response.data;
        $scope.configuracoesSincronizadas = true;
        $scope.sincronizar.configuracoes = true;
        $scope.$broadcast('finaliza-sincronizacao');
      }, function(erro){
        $localStorage.estacionamento.sincronizar = true;
        $scope.sincronizar.configuracoes = true;
        $scope.$broadcast('finaliza-sincronizacao');
      });
    } else {
      $scope.sincronizar.configuracoes = true;
    }

    $scope.qtdEntradasSincronizadas = 0;
    var qtdEntradasSincronizar = $localStorage.entradas.filter(function(value) {return value.sincronizar && !value.datahora_saida}).length;
    var contEntradas = 0;

    if (qtdEntradasSincronizar == contEntradas) {
      $scope.sincronizar.entradas = true;
    } else {
      $localStorage.entradas.forEach(function(elemento, index, array) {
        if(elemento.sincronizar && !elemento.datahora_saida) {
          delete elemento.sincronizar;
          EntradaService.salvar(elemento).then(function(response){
            $scope.qtdEntradasSincronizadas++;
            var index = $localStorage.entradas.indexOf(response.config.data.entrada);
            $localStorage.entradas[index] = response.data;
            contEntradas++;
            $scope.sincronizar.entradas = qtdEntradasSincronizar == contEntradas ? true : false;
            $scope.$broadcast('finaliza-sincronizacao');
          }, function(erro) {
            var index = $localStorage.entradas.indexOf(erro.config.data.entrada);
            $localStorage.entradas[index].sincronizar = true;
            contEntradas++;
            $scope.sincronizar.entradas = qtdEntradasSincronizar == contEntradas ? true : false;
            $scope.$broadcast('finaliza-sincronizacao');
          });
        }
      });
    }

    $scope.qtdSaidasSincronizadas = 0;
    var qtdSaidasSincronizar = $localStorage.entradas.filter(function(value) {return value.sincronizar && value.datahora_saida}).length;
    var contSaidas = 0;

    if (qtdSaidasSincronizar == contSaidas) {
      $scope.sincronizar.saidas = true;
    } else {
      $localStorage.entradas.forEach(function(elemento, index, array) {
        if(elemento.sincronizar && elemento.datahora_saida) {
          delete elemento.sincronizar;
          EntradaService.salvar(elemento).then(function(response){
            $scope.qtdSaidasSincronizadas++;
            var index = $localStorage.entradas.indexOf(response.config.data.entrada);
            $localStorage.entradas[index] = response.data;
            contSaidas++;
            $scope.sincronizar.saidas = qtdSaidasSincronizar == contSaidas ? true : false;
            $scope.$broadcast('finaliza-sincronizacao');
          }, function(erro) {
            var index = $localStorage.entradas.indexOf(erro.config.data.entrada);
            $localStorage.entradas[index].sincronizar = true;
            contSaidas++;
            $scope.sincronizar.saidas = qtdSaidasSincronizar == contSaidas ? true : false;
            $scope.$broadcast('finaliza-sincronizacao');
          });
        }
      });
    }

    $scope.qtdDespesasSincronizadas = 0;

    var qtdDespesasSincronizar = $localStorage.despesas.filter(function(value) {return value.sincronizar}).length;
    var contDespesas = 0;

    if (qtdDespesasSincronizar == contDespesas) {
      $scope.sincronizar.despesas = true;
    } else {
      $localStorage.despesas.forEach(function(elemento, index, array) {
        if(elemento.sincronizar) {
          delete elemento.sincronizar;
          DespesaService.salvar(elemento).then(function(response){
            $scope.qtdDespesasSincronizadas++;
            var index = $localStorage.despesas.indexOf(response.config.data.despesa);
            $localStorage.despesas[index] = response.data;
            contDespesas++;
            $scope.sincronizar.despesas = qtdDespesasSincronizar == contDespesas ? true : false;
            $scope.$broadcast('finaliza-sincronizacao');
          }, function(erro) {
            var index = $localStorage.despesas.indexOf(erro.config.data.despesa);
            $localStorage.despesas[index].sincronizar = true;
            contDespesas++;
            $scope.sincronizar.despesas = qtdDespesasSincronizar == contDespesas ? true : false;
            $scope.$broadcast('finaliza-sincronizacao');
          });
        }
      });
    }

  }

  $scope.$on('finaliza-sincronizacao', function(event) {
    if ($scope.sincronizar.configuracoes 
        && $scope.sincronizar.entradas
        && $scope.sincronizar.saidas
        && $scope.sincronizar.despesas) {
      $ionicPopup.alert({
        title: 'Estacionar',
        subTitle: 'Itens sincronizados:',
        templateUrl: './templates/template-sincronizacao.html',
        scope: $scope
      });
      $ionicLoading.hide();
    }
  });
  
})

.controller('EntradaCtrl', function($scope, $localStorage, $cordovaBarcodeScanner, $ionicPopup, $ionicLoading, $state, EntradaService) {
  
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
        id_tipo_veiculo: $scope.tiposVeiculos[0].id_tipo_veiculo,
        placa: null,
        datahora_entrada: new Date()
      };
      $scope.placa = {};
    }
  }

  validarTiposVeiculos();
  
  $scope.$on('$stateChangeSuccess', 
    function(event, toState, toParams, fromState, fromParams){ 
      if (toState.name == 'tab.entrada') {
        validarTiposVeiculos();
        
      }
    }
  );

  $scope.lerCartao = function() {
    if (!$scope.container.id_tipo_veiculo) {
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

      if (imageData.cancelled) {
        return;
      }

      //Executa o loading
      $ionicLoading.show({});

      var dadosQrCode = JSON.parse(imageData.text);
      //var dadosQrCode = {"sistema":"estacionar","cartao":"4"};
      if (dadosQrCode.sistema == 'estacionar') {
        $scope.container.cartao = dadosQrCode.cartao;

        var entrada = $localStorage.entradas.filter(function(value){return value.cartao == dadosQrCode.cartao && !value.datahora_saida});

        if (entrada.length > 0) {
          $ionicPopup.alert({
            title: 'Estacionar',
            cssClass: 'text-center',
            template: 'O QR code do cartão lido já está em uso. Por favor utilize outro cartão.'
          });
          $ionicLoading.hide();
          return;
        }

        var date = new Date();
        $scope.container.datahora_entrada = date;
        $scope.container.id_estacionamento = $localStorage.estacionamento.id;

        var dataHoraFormatada = date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear() + ' ' + date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();

        $scope.$broadcast('salvar-entrada', $scope.container);
        $ionicLoading.hide();

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
        $ionicLoading.hide();
      }
    }, function(erro) {
      $ionicLoading.hide();
    });
  }

  $scope.$on('salvar-entrada', function(event, entrada){
    EntradaService.salvar(entrada).then(function(response){
      $localStorage.entradas.push(response.data);
    }, function(erro){
      entrada.sincronizar = true;
      $localStorage.entradas.push(entrada);
      console.log(erro);
    });
  });
  
})

.controller('DespesaCtrl', function($scope, $localStorage, $ionicPopup, $ionicLoading, $state, DespesaService) {

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

    $scope.container.id_estacionamento = $localStorage.estacionamento.id;
    $scope.$broadcast('salvar-despesa', $scope.container);

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

  $scope.$on('salvar-despesa', function(event, despesa){
    DespesaService.salvar(despesa).then(function(response){
      $localStorage.despesas.push(response.data);
    }, function(erro){
      despesa.sincronizar = true;
      $localStorage.despesas.push(despesa);
      console.log(erro);
    });
  });

})

.controller('CaixaCtrl', function($scope, $localStorage, EstacionamentoService) {
  
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
          && dataSaida.getUTCDate() == $scope.data.getUTCDate()
          && dataSaida.getUTCMonth() == $scope.data.getUTCMonth()
          && dataSaida.getUTCFullYear() == $scope.data.getUTCFullYear();
    });
    $scope.despesas = $localStorage.despesas.filter(function(value){
      var dataDespesa = new Date(value.data);
      return value
          && value.data
          && dataDespesa.getUTCDate() == $scope.data.getUTCDate()
          && dataDespesa.getUTCMonth() == $scope.data.getUTCMonth()
          && dataDespesa.getUTCFullYear() == $scope.data.getUTCFullYear();
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
    return $scope.data.getUTCDate() < dataAtual.getUTCDate()
        && $scope.data.getUTCMonth() <= dataAtual.getUTCMonth()
        && $scope.data.getUTCFullYear() <= dataAtual.getUTCFullYear();
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

    $scope.$broadcast('salvar-estacionamento', $scope.container);

    var popup = $ionicPopup.alert({
      title: 'Estacionar',
      cssClass: 'text-center',
      template: 'Configurações salvas com sucesso.'
    });
      
    //Finaliza o loading
    $ionicLoading.hide();

    popup.then(function(res) {
      $state.go('tab.inicio');
    });
  }

  $scope.$on('salvar-estacionamento', function(event, estacionamento){
    delete estacionamento.sincronizar;
    EstacionamentoService.salvar(estacionamento).then(function(response){
      estacionamento.id = response.data.id;
      $localStorage.estacionamento = estacionamento;
      $rootScope.$broadcast('atualizar-estacionamento');
    }, function(erro){
      estacionamento.sincronizar = true;
      $localStorage.estacionamento = estacionamento;
      console.log(erro);
    });
  });

})

.controller('LoginCtrl', function($scope, $localStorage, $ionicPopup, $ionicLoading, $state, $rootScope, UsuarioService, ESTACIONAR_CONFIG) {

  $scope.data = {};

  $scope.versao = ESTACIONAR_CONFIG.VERSAO_APLICACAO;

  var dataAtual = new Date();
  dataAtual.setHours(0, 0, 0, 0);

  if($localStorage.usuario && $localStorage.usuario.dataLogin === dataAtual.toISOString()) {
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

      var dataAtual = new Date();
      dataAtual.setHours(0, 0, 0, 0);

      $localStorage.usuario.dataLogin = dataAtual;

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