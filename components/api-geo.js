import React from 'react'
import PropTypes from 'prop-types'
import debounce from 'debounce'

import theme from '../styles/theme'

import SearchInput from './search-input'

class ApiGeo extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      value: '',
      results: [],
      loading: false
    }

    this.updateValue = this.updateValue.bind(this)
    this.search = this.search.bind(this)
    this.selectTerritory = this.selectTerritory.bind(this)

    this.search = debounce(this.search, 200)
  }

  updateValue(value) {
    const {territoryType} = this.props
    const field = territoryType === 'communes' ? 'departement' : 'region'
    const url = `https://geo.api.gouv.fr/${territoryType.replace('é', 'e')}?nom=${value}&fields=${field}&boost=population`
    this.setState({value, results: [], loading: true}, this.search(url))
  }

  componentDidUpdate(prevProps) {
    if (this.props.territoryType !== prevProps.territoryType) {
      this.clearInput()
    }
  }

  clearInput() {
    this.setState({value: ''})
  }

  getItemValue(item) {
    return item.nom
  }

  renderItem(item, isHighlighted) {
    let description

    if (item.departement) {
      description = `${item.departement.nom} - ${item.departement.code}`
    } else if (item.region) {
      description = item.region.nom
    } else {
      description = 'Collectivité d’outre-mer'
    }

    return (
      <div key={item.code} className={`item ${isHighlighted ? 'item-highlighted' : ''}`}>
        <div>{item.nom}</div>
        <div>{description}</div>
        <style jsx>{`
          .item {
            display: flex;
            flex-flow: row;
            justify-content: space-between;
            align-items: center;
            padding: 1em;
            border-bottom: 1px solid whitesmoke;
          }

          .item:hover {
            cursor: pointer;
          }

          .item-highlighted {
            background-color: ${theme.primary};
            color: ${theme.colors.white};
          }
        `}</style>
      </div>
    )
  }

  search(url) {
    const options = {
      headers: {
        Accept: 'application/json'
      },
      mode: 'cors',
      method: 'GET'
    }

    fetch(url, options).then(response => {
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.indexOf('application/json') !== -1) {
        response.json().then(json => {
          this.setState({
            results: json.splice(0, 10) || [],
            loading: false
          })
        })
      } else {
        this.setState({
          results: [],
          loading: false
        })
      }
    })
  }

  selectTerritory(value, feature) {
    const {onSelect} = this.props
    this.setState({value: feature.nom})
    onSelect(feature)
  }

  render() {
    const {territoryType} = this.props
    const {value, loading, results} = this.state
    const placeholder = territoryType === 'communes' ?
      'Taper le nom de la commune' :
      'Taper le nom du département'

    return (
      <SearchInput
        value={value}
        results={results}
        isLoading={loading}
        placeholder={placeholder}
        renderItem={this.renderItem}
        getItemValue={this.getItemValue}
        onSearch={this.updateValue}
        onSelect={this.selectTerritory} />
    )
  }
}

ApiGeo.propTypes = {
  onSelect: PropTypes.func.isRequired,
  territoryType: PropTypes.string.isRequired
}

export default ApiGeo
