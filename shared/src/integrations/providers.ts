export interface IEmailProvider {
  send(to: string, subject: string, body: string): Promise<void>;
}

export interface ICalendarProvider {
  createEvent(event: any): Promise<string>;
}

export interface IStorageProvider {
  upload(file: any): Promise<string>;
}

export interface IGitHubProvider {
  createIssue(title: string, body: string): Promise<void>;
}
