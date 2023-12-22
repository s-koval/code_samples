export class HttpException extends Error {
  status: number;
  message: string;
  constructor(message: string, status: number ) {
    super(message);
    this.status = status;
    this.message = message;
  }
}

export class NotFoundException extends HttpException {
  constructor(name: string) {
    super( `Data name '${name}' not found`, 404);
  }
}