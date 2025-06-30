import { Injectable } from '@nestjs/common';

@Injectable()
export class MailService {
  sendMail() {
    console.log('mail sent');
  }
}
