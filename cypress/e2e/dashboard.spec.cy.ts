/// <reference types="cypress" />

describe('dashboard spec', () => {
  before(() => {
    cy.visit('http://localhost:3000').then(() =>
      cy.window().then((window) => {
        (window as any).electron = {
          getDefaultDirectory: async () => {
            return '/Users/suomynona/.cardano-node-ui';
          },
          getSocketPath: (directory: string, selectedNetwork: string) => {
            const databaseDirectory = `${directory}/${selectedNetwork}-db`;
            const socketPath = `${databaseDirectory}/node.socket`;

            return `export CARDANO_NODE_SOCKET_PATH="${socketPath}"`;
          },
        };
      })
    );
  });

  it('should switch the network and adjust the node.socket path', () => {
    cy.get('[data-testid="network-selector-input"]').should(
      'have.value',
      'mainnet'
    );
    cy.get('[data-testid="socket-path-field"]')
      .find('input')
      .invoke('val')
      .should('include', 'mainnet-db');

    cy.get('[data-testid="network-selector"]').click();
    cy.get('[data-testid="network-option-preprod"]').click({ force: true });

    cy.get('[data-testid="network-selector-input"]').should(
      'have.value',
      'preprod'
    );
    cy.get('[data-testid="socket-path-field"]')
      .find('input')
      .invoke('val')
      .should('include', 'preprod-db');
  });
});
