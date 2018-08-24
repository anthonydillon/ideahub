import React from 'react'
import { FirestoreCollection } from 'react-firestore'

import Error from '../misc/Error'
import createSubscription from '../../actions/createSubscription'
import updateSubscription from '../../actions/updateSubscription'
import deleteSubscription from '../../actions/deleteSubscription'

class Subscription extends React.Component {

  // https://stripe.com/docs/checkout#integration-custom
  componentDidMount() {
    this.stripeCheckout = window.StripeCheckout.configure({
      key: process.env.REACT_APP_STRIPE_PUBLIC_KEY,
      locale: 'auto',
      image: 'https://stripe.com/img/documentation/checkout/marketplace.png',
      name: 'Firefly',
      description: 'Subscribe to Firefly',
      email: this.props.auth.email,
      allowRememberMe: false,
      amount: 20 * 100, // in cents
    })
  }

  newSubscription = () => {
    this.stripeCheckout.open({
      token: createSubscription,
    })
  }

  updatePaymentMethod = subscriptionId => {
    this.stripeCheckout.open({
      token: token => updateSubscription(subscriptionId, token),
    })
  }

  componentWillUnmount() {
    this.stripeCheckout.close()
  }

  render() {
    return <FirestoreCollection
      path="subscriptions"
      filter={['user', '==', this.props.auth.uid]}
    >
      { ({error, isLoading, data}) => {
                
        if (error) {
          return <Error error={error} />
        }

        if (isLoading) {
          return <p>loading...</p>
        }

        const subscription = data[0]

        if (!subscription) {
          return <div>
            <p>Subscribe to Firefly to get paid features</p>
            <button onClick={this.newSubscription}>Subscribe now</button>
          </div>
        }

        if (subscription.stripeSubscriptionError) {
          return <div style={{color: 'red'}}>
            <p>Whoops&mdash;there was an error updating your subscription.</p>
            <p style={{fontFamily: 'monospace'}}>{subscription.stripeSubscriptionError}</p>
          </div>
        }

        if (subscription.tempStripePaymentTokenId) {
          return <p>Updating your subscription...</p>
        }

        const cancelConfirmation = `Are you sure you want to cancel your subscription? You won't have access to paid Firefly features.`
        return <div>
          <p>You are subscribed!</p>
          <p>Status: {subscription.stripeSubscriptionStatus}</p>
          <button onClick={() => this.updatePaymentMethod(subscription.id)}>Update payment method</button>
          <button onClick={() => {
            if (window.confirm(cancelConfirmation)) {
              deleteSubscription(subscription)
            }
          }}>Cancel subscription</button>
        </div>

      }}
    </FirestoreCollection>
  }
}

export default Subscription
