const _ = require('lodash');
const moment = require('moment');
const Promise = require('bluebird');
const MockableMoment = require('../../moment');
const logger = require('../../log/logger');
const EmailQueue = require('../../email/templates');

const TEMPLATE_NAME = 'provider-offers-tasks-notification';
const URGENT_TEMPLATE_NAME = 'provider-offers-tasks-urgent-notification';
const EXPIRED_TEMPLATE_NAME = 'provider-offers-expired-tasks-notification';
const ACCEPTED_TEMPLATE_NAME = 'provider-offers-accepted-tasks-notification';
const CLOSED_TEMPLATE_NAME = 'provider-offers-closed-tasks-notification';
const ROUND_TTL_MINUTES = 30;
const getProjectManagersNames = (pms) => {
  const initialValue = '';
  if (!_.isArray(pms)) {
    return initialValue;
  }
  return pms.reduce((nameString, pm) => {
    if (!_.isEmpty(nameString)) {
      nameString += ', ';
    }
    nameString += `${pm.firstName} ${pm.lastName}`;
    return nameString;
  }, initialValue);
};

class ProviderPoolingOfferScheduler {
  constructor(configuration, schema) {
    Object.assign(this, { configuration, schema, logger });
  }

  async run(job, done) {
    const { NODE_ENV } = this.configuration.environment;
    const isProd = NODE_ENV === 'PROD';
    const mockServerTime = _.get(job, 'attrs.data.params.flags.mockServerTime');
    const mock = _.get(job, 'attrs.data.params.flags.mock', false);
    const lspId = _.get(job, 'attrs.data.lspId');
    const mockableMoment = new MockableMoment(mockServerTime).getDateObject();
    const roundStartTime = mockableMoment.subtract(ROUND_TTL_MINUTES, 'minutes');
    let error;
    const query = {
      lspId,
      isActive: true,
      $or: [
        { roundStartedAt: null },
        { roundStartedAt: { $lte: roundStartTime } },
      ],
    };
    if (!isProd) {
      if (mock) {
        query.mock = true;
      } else {
        query.mock = { $ne: true };
      }
    }
    try {
      await this.schema.ProviderPoolingOffer.find(query)
        .cursor()
        .eachAsync((offer) => this._processOffer(offer));
    } catch (err) {
      error = err;
      this.logger.error(`Error processing provider pooling offers: ${JSON.stringify(err)}`);
    } finally {
      done(error);
    }
  }

  async sendExpiredNotification(offer) {
    await offer.populate([{ path: 'abilityId', select: 'name' }]);
    const context = await this._createContextFromOffer(offer);
    const offerAuthor = { email: offer.createdBy };
    await this._queueEmails([offerAuthor], context, EXPIRED_TEMPLATE_NAME, offer.lspId);
  }

  async sendAcceptedNotification(offer) {
    const context = await this._createContextFromOffer(offer);
    const offerAuthor = { email: offer.createdBy };
    context.provider = `${offer.acceptedBy.firstName} ${offer.acceptedBy.lastName}`;
    await this._queueEmails([offerAuthor], context, ACCEPTED_TEMPLATE_NAME, offer.lspId);
  }

  async sendClosedNotification(offer) {
    const context = await this._createContextFromOffer(offer);
    const providersToExclude = offer.declinedBy.map((item) => item.providerId.toString());
    if (!_.isNil(offer.acceptedBy)) {
      providersToExclude.push(offer.acceptedBy._id);
    }
    const providersToNotify = offer.notifiedProviders
      .filter(({ _id }) => !providersToExclude.includes(_id.toString()));
    await this._queueEmails(
      providersToNotify,
      context,
      CLOSED_TEMPLATE_NAME,
      offer.lspId,
    );
  }

  async _processOffer(offer) {
    if (offer.currentRound === offer.roundsNo) {
      return this._markOfferAsInactive(offer);
    }
    await offer.populate([
      { path: 'abilityId', select: 'name' },
      { path: 'providersQueue', select: 'email', options: { withDeleted: true } },
      { path: 'request._id', select: 'projectManagers' },
    ]);

    const providersToNotify = offer.providersQueue
      .splice(0, offer.providersPerRoundNo);
    const context = await this._createContextFromOffer(offer);
    await this._queueEmails(
      providersToNotify,
      context,
      offer.isUrgent ? URGENT_TEMPLATE_NAME : TEMPLATE_NAME,
      offer.lspId,
    );
    const currentRound = offer.currentRound + 1;
    const roundStartedAt = moment().utc();
    const providerIds = [];
    const notificationsDetails = [];
    providersToNotify.forEach((provider) => {
      providerIds.push(provider._id);
      notificationsDetails.push({
        providerId: provider._id,
        sentDate: roundStartedAt,
        roundNo: currentRound,
      });
    });
    Object.assign(offer, {
      currentRound,
      roundStartedAt,
      notifiedProviders: offer.notifiedProviders.concat(providerIds),
      notificationsDetails: offer.notificationsDetails.concat(notificationsDetails),
    });
    return offer.save();
  }

  async _markOfferAsInactive(offer) {
    offer.isActive = false;
    offer.status = 'Closed';
    await this.sendExpiredNotification(offer);
    await offer.save();
  }

  async _createContextFromOffer(offer) {
    const path = await this._getPortalURL(offer);
    return {
      path,
      languageCombination: offer.languageCombination.text,
      reqNumber: offer.request.no,
      filesAmount: offer.filesAmount,
      ability: _.get(offer, 'abilityId.name', ''),
      quantity: offer.quantity,
      dueDate: moment(offer.dueDate).format('MM-DD-YYYY hh:mm '),
      startDate: moment(offer.startDate).format('MM-DD-YYYY hh:mm'),
      pm: getProjectManagersNames(_.get(offer, 'request._id.projectManagers', '')),
    };
  }

  async _queueEmails(usersToNotify, context, templateName, lspId) {
    const emailQueue = new EmailQueue(this.logger, this.schema, this.configuration);

    await Promise.mapSeries(usersToNotify, (user) => {
      Object.assign(context, { user });
      return emailQueue.send({ templateName, context, lspId });
    });
  }

  async _getPortalURL(offer) {
    const lsp = await this.schema.Lsp.findById(offer.lspId);
    return lsp.url;
  }
}

module.exports = ProviderPoolingOfferScheduler;
