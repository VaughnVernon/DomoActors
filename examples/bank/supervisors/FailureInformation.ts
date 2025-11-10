import {
  RequestType,
  OpenAccountRequest,
  DepositRequest,
  WithdrawalRequest,
  TransferRequest,
  AccountSummaryRequest,
  TransactionHistoryRequest
 }
  from '../model/BankTypes'

  export const failureExplanation = function(command: string, request: any): string {
    const cleanCommand = command.trim()

    let explained = 'During ${cleanCommand} the operation failed due to:\n';
    let typedRequest = undefined

    switch (cleanCommand) {
      case RequestType.OpenAccount:
        typedRequest = request as OpenAccountRequest
        explained = explained +
          '           Owner: ${typedRequest.owner}\n' +
          '    Account Type: ${typedRequest.accountType}\n' +
          ' Initial Balance: ${typedRequest.initialBalance}\n'
        break
      case RequestType.Deposit:
        typedRequest = request as DepositRequest
        explained = explained +
          ' Account Id: ${typedRequest.accountId}\n' +
          '     Amount: ${typedRequest.amount}\n'
        break
      case RequestType.Withdraw:
        typedRequest = request as WithdrawalRequest
        explained = explained +
          ' Account Id: ${typedRequest.accountId}\n' +
          '     Amount: ${typedRequest.amount}\n'
        break
      case RequestType.Transfer:
        typedRequest = request as TransferRequest
        explained = explained +
          ' From Account: ${typedRequest.fromAccountId}\n' +
          '   To Account: ${typedRequest.toAccountId}\n' +
          '       Amount: ${typedRequest.amount}\n'
        break
      case RequestType.AccountSummary:
        typedRequest = request as AccountSummaryRequest
        explained = explained +
          ' Account Id: ${typedRequest.accountId}\n'
        break
      case RequestType.TransactionHistory:
        typedRequest = request as TransactionHistoryRequest
        explained = explained +
          '  Account Id: ${typedRequest.accountId}\n' +
          ' Limit Count: ${typedRequest.limit?}\n'
        break
      case RequestType.AllAccounts:
        explained = explained + ' An undetermined failure.'
        break
      case RequestType.PendingTransfers:
        explained = explained + ' An undetermined failure.'
        break
      default:
        explained = 'The failure seems to be out of scope.'
    }

    return explained
  }