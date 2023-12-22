import SNS from "../db/models/sns.model";
import snsService from "../modules/message/service/sns.service";
import snsServices from "../modules/message/service/sns.service";

const parseMessages = async () => {
  const messages = await SNS.findAll();

  for await (const message of messages) {
    try {
      if (message?.data) {
        await snsService.snsSubscribe(message.data);
        await snsService.snsNotification(message.data);
        await snsServices.deleteSNS(message.id);
      }
    } catch (e) {
      console.log(e)
    }
  }
};

export default parseMessages;